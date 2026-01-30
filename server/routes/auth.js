const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

// Register User
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });
        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        // Seed default categories for new user
        const defaultCats = [
            { name: 'Salary', type: 'income', color: '#2ecc71' },
            { name: 'Freelance', type: 'income', color: '#3498db' },
            { name: 'Food', type: 'expense', color: '#e74c3c' },
            { name: 'Rent', type: 'expense', color: '#9b59b6' },
            { name: 'Transport', type: 'expense', color: '#f1c40f' },
            { name: 'Entertainment', type: 'expense', color: '#e67e22' },
            { name: 'Utilities', type: 'expense', color: '#34495e' }
        ];
        await Category.insertMany(defaultCats.map(c => ({ ...c, user: user.id, isDefault: false })));

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) { res.status(500).send('Server Error'); }
});

// Login User
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // Adjusted to 'identifier' for consistency with Plan 4 (Username login)
    try {
        // Check email OR username
        let user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

// Get User Data
router.get('/', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');
        res.json(user);
    } catch (err) { res.status(401).json({ msg: 'Invalid token' }); }
});

// --- IMPERSONATE / DEMO ---
router.post('/demo', async (req, res) => {
    try {
        const randId = Math.floor(Math.random() * 10000);
        const demoUser = new User({
            name: `Demo User`,
            email: `demo${randId}@example.com`,
            username: `demo_user_${randId}`,
            password: 'demo_password', // Plain text, doesn't matter for ephemeral demo
            xp: Math.floor(Math.random() * 5000),
            level: Math.floor(Math.random() * 10) + 1,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=demo${randId}`
        });

        // Hash pass just in case
        const salt = await bcrypt.genSalt(10);
        demoUser.password = await bcrypt.hash('123456', salt);
        await demoUser.save();

        // 1. Seed Categories
        const catsData = [
            { name: 'Salary', type: 'income', color: '#2ecc71' },
            { name: 'Investments', type: 'income', color: '#3498db' },
            { name: 'Food', type: 'expense', color: '#e74c3c' },
            { name: 'Rent', type: 'expense', color: '#9b59b6' },
            { name: 'Transport', type: 'expense', color: '#f1c40f' },
            { name: 'Shopping', type: 'expense', color: '#e67e22' },
            { name: 'Utilities', type: 'expense', color: '#34495e' },
            { name: 'Health', type: 'expense', color: '#ff6b6b' }
        ];
        const categories = await Category.insertMany(catsData.map(c => ({ ...c, user: demoUser.id, isDefault: false })));

        // 2. See Transactions (Random 50)
        const transactions = [];
        const now = new Date();
        for (let i = 0; i < 50; i++) {
            const isIncome = Math.random() > 0.7; // 30% Income
            const type = isIncome ? 'income' : 'expense';
            const relevantCats = categories.filter(c => c.type === type);
            const cat = relevantCats[Math.floor(Math.random() * relevantCats.length)];

            // Random date within last 3 months
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 90));

            transactions.push({
                user: demoUser.id,
                title: isIncome ? 'Payment Received' : `Purchase at Store ${i}`,
                amount: Math.floor(Math.random() * (isIncome ? 2000 : 100)) + 10,
                type,
                category: cat.name,
                date: date,
                notes: 'Auto-generated demo transaction'
            });
        }
        await Transaction.insertMany(transactions);

        // Login
        const payload = { user: { id: demoUser.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

    } catch (err) { console.error(err); res.status(500).send('Server Error'); }
});

module.exports = router;
