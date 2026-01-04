import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import http from "node:http";
// Use environment variables for Docker networking
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
    endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local"
    },
    // PERFORMANCE OPTIMIZATION: Reuse TCP connections
    requestHandler: new NodeHttpHandler({
        httpAgent: new http.Agent({ 
            keepAlive: true,
            maxSockets: 50 
        })
    })
});

// The DocumentClient makes it easier to work with plain JSON
const  docClient = DynamoDBDocumentClient.from(client);

export default docClient;
