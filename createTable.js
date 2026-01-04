import { CreateTableCommand } from "@aws-sdk/client-dynamodb";
import docClient from "./src/db/dbClient.js"; // Must include .js

const tableNameArg = process.argv[2]; 
const TABLE_NAME = tableNameArg || "Users";

const createTable = async (tableName) => {
    const params = {
        TableName: tableName,
        AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            { AttributeName: "sk", AttributeType: "S" }
        ],
        KeySchema: [
            { AttributeName: "id", KeyType: "HASH" },
            { AttributeName: "sk", KeyType: "RANGE" }
        ] ,
        /*ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
        } */
       BillingMode: "PAY_PER_REQUEST"
    };

    try {
        console.log(` Attempting to create table: ${tableName}`);
        const data = await docClient.send(new CreateTableCommand(params));
        console.log(" Success: Table Created ->", data.TableDescription.TableArn);
    } catch (err) {
        if (err.name === 'ResourceInUseException') {
            console.log("ℹ Note: Table already exists.");
        } else {
            console.error(" Error:", err.message);
            process.exit(1);
        }
    }
};

createTable(TABLE_NAME);