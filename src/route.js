const express = require('express');
const router = express.Router();
const userDbService = require('../services/user-db-service');



router.get('/', async (req, res) => {
    try {
        const user = await userDbService.listAllUsers();
        if (!user) return res.status(404).send("User not found");
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/user/:id', async (req, res) => {
    try {
        const user = await userDbService.getUserById(req.params.id);
        if (!user) return res.status(404).send("User not found");
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/user', async (req, res) => {
    try {
        await userDbService.registerUser(req.body);
        res.status(201).json({ status: "User registered" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


/**
 * @route   POST /api/users/migrate
 * @desc    Trigger a heavy write migration for 1,000+ users
 * @access  Public (should be Admin in production)
 */
router.post('/migrate', (req, res) => {
    // 1. Prepare the mock data (or take from req.body)
    const mockData = Array.from({ length: 1000 }, (_, i) => ({
        id: `gen_${Date.now()}_${i}`,
        email: `user${i}@example.com`,
        name: `User ${i}`
    }));

    // 2. Respond immediately to the client (HTTP 202 Accepted)
    // This prevents the browser/Postman from timing out.
    res.status(202).json({
        message: "Heavy write migration started in the background.",
        estimatedItems: mockData.length,
        batchSize: 25,
        concurrencyLimit: 5
    });

    // 3. Execute the heavy write in the background
    console.log("--- Starting Background Migration ---");
    console.time('Total Migration Time');

    userDbService.bulkRegisterUsers(mockData)
        .then(report => {
            console.log("--- Migration Finished ---");
            console.table(report); // Shows a nice table in your Docker logs
            console.timeEnd('Total Migration Time');
            
            // In a real app, you could emit a Socket.io event or update a Redis status here
        })
        .catch(err => {
            console.error("CRITICAL: Background Migration Failed!", err);
        });
});



module.exports = router;