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

// UPDATE Category (Name/Color)
router.put('/:id', auth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Not found' });
        if (category.isDefault) return res.status(400).json({ msg: 'Cannot edit default' });
        if (category.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        // If name changes, we should update transactions too, or else the link breaks
        // Currently transactions store 'category' as STRING. So we MUST update them.
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
        if (category.isDefault) return res.status(400).json({ msg: 'Cannot delete default category' });
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
