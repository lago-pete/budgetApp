const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Transaction = require('../models/Transaction'); // Needed for reassignment
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
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

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

// Delete Category
router.delete('/:id', auth, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Category not found' });
        if (category.isDefault) return res.status(400).json({ msg: 'Cannot delete default category' });
        if (category.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        // Move transactions to "Other"
        await Transaction.updateMany(
            { user: req.user.id, category: category.name },
            { category: 'Other' }
        );

        // Also update by ID if logic changes to ID based, but currently using Name string
        // If we switched to ID based, this would be { category: category._id }

        await category.deleteOne();
        res.json({ msg: 'Category deleted' });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
