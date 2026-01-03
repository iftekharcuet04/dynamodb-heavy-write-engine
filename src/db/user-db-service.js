const dbService = require('./dbService');

// Define table name from environment for Docker/Cloud flexibility
const TABLE_NAME = process.env.USERS_TABLE || "test-table";

const userDbService = {

    // Standard CRUD - Single Item Fetch
    getUserById: async (userId) => {
        return await dbService.getItem(TABLE_NAME, { id: userId, sk: "METADATA" });
    },

    // Standard CRUD - Single User Creation
    registerUser: async (userData) => {
        const newUser = {
            id: userData.id,
            sk: "METADATA",
            email: userData.email,
            name: userData.name,
            createdAt: new Date().toISOString()
        };
        return await dbService.createItem(TABLE_NAME, newUser);
    },

    // Specific Update Logic using AttributeNames for reserved keywords like 'name'
    updateUserEmail: async (userId, newEmail) => {
        return await dbService.updateItem(
            TABLE_NAME, 
            { id: userId, sk: "METADATA" }, 
            "SET email = :e", 
            { ":e": newEmail }
        );
    },

    // List all users (Scan operation - use carefully in production)
    listAllUsers: async () => {
        return await dbService.getAllItems(TABLE_NAME);
    }
};

module.exports = userDbService;