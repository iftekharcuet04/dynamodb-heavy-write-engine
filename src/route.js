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


module.exports = router;