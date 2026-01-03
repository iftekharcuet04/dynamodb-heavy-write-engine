import { createItem, getAllItems, getItem, heavyWriteManager, updateItem } from './dbService.js';

// Define table name from environment for Docker/Cloud flexibility
const TABLE_NAME = process.env.USERS_TABLE || "Users";

const userDbService = {

    // Standard CRUD - Single Item Fetch
    getUserById: async (userId) => {
        return await getItem(TABLE_NAME, { id: userId, sk: "METADATA" });
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
        return await createItem(TABLE_NAME, newUser);
    },

    // Specific Update Logic using AttributeNames for reserved keywords like 'name'
    updateUserEmail: async (userId, newEmail) => {
        return await updateItem(
            TABLE_NAME, 
            { id: userId, sk: "METADATA" }, 
            "SET email = :e", 
            { ":e": newEmail }
        );
    },

    // List all users (Scan operation - use carefully in production)
    listAllUsers: async () => {
        return await getAllItems(TABLE_NAME);
    },

    /**
     * Heavy Write / Bulk Ingestion
     * high-volume data handling by delegating to the 
     */
    bulkRegisterUsers: async (userList) => {
        console.log(`[User-Service] Preparing bulk ingestion for ${userList.length} users...`);

        // Transform raw data into the required Schema format
        const preparedUsers = userList.map(user => ({
            id: user.id || `user_${Math.random().toString(36).substr(2, 9)}`,
            sk: "METADATA", // Utilizing PK+SK pattern for Single Table Design
            email: user.email,
            name: user.name,
            role: user.role || 'customer',
            createdAt: new Date().toISOString(),
            status: 'ACTIVE'
        }));

        return await heavyWriteManager(TABLE_NAME, preparedUsers);
    },
};

export default userDbService;