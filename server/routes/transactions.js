const express = require('express');
const router = express.Router();
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

// GET with Filters
router.get('/', auth, async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = { user: req.user.id };

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
    }

    try {
        const transactions = await Transaction.find(query).sort({ date: -1 });
        res.json(transactions);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Add
router.post('/', auth, async (req, res) => {
    const { title, amount, type, category, proofUrl, notes, date } = req.body;
    try {
        const newTx = new Transaction({
            title, amount, type, category, proofUrl, notes,
            date: date || Date.now(),
            user: req.user.id
        });
        await newTx.save();
        res.json(newTx);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Update
router.put('/:id', auth, async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ msg: 'Transaction not found' });
        if (tx.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        const { title, amount, type, category, notes, date } = req.body;
        if (title) tx.title = title;
        if (amount) tx.amount = amount;
        if (type) tx.type = type;
        if (category) tx.category = category;
        if (notes) tx.notes = notes;
        if (date) tx.date = date;

        await tx.save();
        res.json(tx);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Delete
router.delete('/:id', auth, async (req, res) => {
    try {
        const tx = await Transaction.findById(req.params.id);
        if (!tx) return res.status(404).json({ msg: 'Transaction not found' });
        if (tx.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

        await tx.deleteOne();
        res.json({ msg: 'Transaction removed' });
    } catch (err) { res.status(500).send('Server Error'); }
});

module.exports = router;
