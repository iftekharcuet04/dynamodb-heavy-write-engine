const docClient = require("./dbClient");

const { 
    PutCommand, 
    GetCommand, 
    UpdateCommand, 
    ScanCommand
} = require("@aws-sdk/lib-dynamodb");

const dbService = {
    // Create item
    createItem: async (tableName, item) => {
        const command = new PutCommand({
            TableName: tableName,
            Item: item
        });
        return await docClient.send(command);
    },

    // Fetch Item
    getItem: async (tableName, id) => {
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
       
    },

    // Update Item
    updateItem: async (tableName, key, updateExpression, attributeValues, attributeNames = {}) => {
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
    },

    // List
    getAllItems: async (tableName) => {
        const command = new ScanCommand({ TableName: tableName });
        const response = await docClient.send(command);
        return response.Items;
    }

  
};

module.exports = dbService;