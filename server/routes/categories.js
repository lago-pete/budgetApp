const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// Auth middleware inline
const jwt = require('jsonwebtoken');
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// Get Categories (Default + User Custom)
router.get('/', auth, async (req, res) => {
    try {
        const categories = await Category.find({
            $or: [
                { isDefault: true },
                { user: req.user.id }
            ]
        });
        res.json(categories);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Add Category
router.post('/', auth, async (req, res) => {
    const { name, type, color } = req.body;
    try {
        const newCat = new Category({
            name,
            type,
            color,
            isDefault: false,
            user: req.user.id
        });
        await newCat.save();
        res.json(newCat);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;
