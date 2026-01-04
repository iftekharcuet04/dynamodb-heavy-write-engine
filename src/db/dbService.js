import docClient from "./dbClient.js";

import {
    BatchWriteCommand,
    GetCommand,
    PutCommand,
    ScanCommand,
    UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


    // Create item
 export const createItem= async (tableName, item) => {
        const command = new PutCommand({
            TableName: tableName,
            Item: item
        });
        return await docClient.send(command);
    };

    // Fetch Item
  export const  getItem= async (tableName, id) => {
        const command = new GetCommand({
            TableName: tableName,
            Key: { id } 
        });

        try {
            const response = await docClient.send(command);
            return response.Item;
        } catch (error) {
            throw error;
        }
       
    };

    // Update Item
   export const updateItem =  async (tableName, key, updateExpression, attributeValues, attributeNames = {}) => {
        const command = new UpdateCommand({
            TableName: tableName,
            Key: key, // e.g., { id: "123" }
            UpdateExpression: updateExpression, // e.g., "set #email = :e"
            ExpressionAttributeValues: attributeValues, // e.g., { ":e": "test@test.com" }
            // Use ExpressionAttributeNames to handle reserved keywords (like 'name', 'user', 'order')
            ExpressionAttributeNames: Object.keys(attributeNames).length > 0 ? attributeNames : undefined,
            ReturnValues: "ALL_NEW"
        });
        
        try {
            const response = await docClient.send(command);
            return response.Attributes;
        } catch (err) {
            console.error("Update Item Failed:", err);
            throw err;
        }
    };

    // List
   export const getAllItems= async (tableName) => {
        const command = new ScanCommand({ TableName: tableName });
        const response = await docClient.send(command);
        return response.Items;
    };

    // Heavy write: with batching+ Retry with delay exponential backoff
    /**
     * batchWriteWithRetry
     * Handles the 25-item limit and partial failures (UnprocessedItems).
     */
   const batchWriteWithRetry= async (tableName, items, attempt = 0) => {
    const MAX_RETRIES = 8;
    const params = { 
        RequestItems: { 
            [tableName]: items.map(i => ({ PutRequest: { Item: i } })) 
        } 
    };

    try {
        const response = await docClient.send(new BatchWriteCommand(params));
        const unprocessed = response.UnprocessedItems?.[tableName];

        // If some items failed (Throttling/Partition Heat), retry only those items
        if (unprocessed?.length > 0 && attempt < MAX_RETRIES) {
            // Exponential Backoff + Jitter
            const delay = Math.pow(2, attempt) * 50 + (Math.random() * 100);
            await sleep(delay);
            
            const failedItems = unprocessed.map(u => u.PutRequest.Item);
            return await batchWriteWithRetry(tableName, failedItems, attempt + 1);
        }

        if (unprocessed?.length > 0) {
            throw new Error(`${unprocessed.length} items failed after ${MAX_RETRIES} retries.`);
        }

        return { success: true, count: items.length };
    } catch (err) {
        throw err; // Passed up to the heavyWriteManager
    }
};

    /**
     * heavyWriteManager
     * Manages 10,000+ items by chunking and controlling concurrency.
     */
    export const heavyWriteManager= async (tableName, allItems) => {
        const CHUNK_SIZE = 25;
        const CONCURRENCY_LIMIT = 20; // 5 parallel requests (125 items total per group)
        
        const chunks = [];
        for (let i = 0; i < allItems.length; i += CHUNK_SIZE) {
            chunks.push(allItems.slice(i, i + CHUNK_SIZE));
        }

        const report = {
            totalItems: allItems.length,
            succeededItems: 0,
            failedItems: 0,
            batchErrors: []
        };

        // Process in groups of 5 batches
        for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
            const group = chunks.slice(i, i + CONCURRENCY_LIMIT);
            
            // Execute parallel HTTP requests to different DB partitions
            const results = await Promise.allSettled(
                group.map(chunk => batchWriteWithRetry(tableName, chunk))
            );

            results.forEach((result, index) => {
                const currentChunkSize = group[index].length;
                if (result.status === 'fulfilled') {
                    report.succeededItems += currentChunkSize;
                } else {
                    report.failedItems += currentChunkSize;
                    report.batchErrors.push({
                        error: result.reason.message,
                        itemCount: currentChunkSize
                    });
                }
            });

            console.log(`[Progress] Processed ${Math.min((i + CONCURRENCY_LIMIT) * CHUNK_SIZE, allItems.length)} / ${allItems.length}`);
        }

        return report;
    }
  


