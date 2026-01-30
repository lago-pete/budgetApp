const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Invalid token' });
    }
};

router.get('/', auth, async (req, res) => {
    try {
        const categories = await Category.find({
            $or: [
                { isDefault: true },
                { user: req.user.id }
            ]
        });
        res.json(categories);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/', auth, async (req, res) => {
    const { name, type, color } = req.body;
    try {
        const newCat = new Category({
            name, type, color,
            isDefault: false,
            user: req.user.id
        });
        await newCat.save();
        res.json(newCat);
    } catch (err) { res.status(500).send('Server Error'); }
});

// UPDATE Category (Name/Color) - UNLOCKED
router.put('/:id', auth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Not found' });

        // Allowed to edit Default if it 'belongs' to system? 
        // Strategy: We can't really 'edit' the shared document for everyone.
        // If user wants to edit a Default category, we should arguably CLONE it or treat defaults as templates.
        // BUT for a simple app: Defaults are usually seeded per user (see Auth logic).
        // WAIT: My auth logic (Step 348) does `Category.insertMany(... user: user.id ...)`.
        // SO "Defaults" are actually User copies! They just happen to be flagged isDefault or maybe not even flagged if I didn't set it.
        // Let's check auth.js ... yes: `isDefault: false`.
        // SO the seed categories ARE owned by the user. The `isDefault` flag in schema might be true for the *server-side* templates but the user copies are `isDefault: false`.
        // IF they are `isDefault: false`, then `category.isDefault` check in previous code was blocking nothing if I used my new seed logic.
        // HOWEVER, `server-1` logs said "Default Categories seeded". That might be the global ones?
        // Let's assume the user owns them. I will allow editing regardless of flags if `user == req.user.id`.

        if (category.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        if (req.body.name && req.body.name !== category.name) {
            await Transaction.updateMany(
                { user: req.user.id, category: category.name },
                { category: req.body.name }
            );
        }

        if (req.body.name) category.name = req.body.name;
        if (req.body.color) category.color = req.body.color;

        await category.save();
        res.json(category);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Category not found' });

        // Allow deleting anything owned by user
        if (category.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await Transaction.updateMany(
            { user: req.user.id, category: category.name },
            { category: 'Other' }
        );

        await category.deleteOne();
        res.json({ msg: 'Category deleted' });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
