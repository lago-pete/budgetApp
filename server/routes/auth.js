const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, username } = req.body; // Added username
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        // Check username uniqueness if provided
        if (username) {
            const userByNick = await User.findOne({ username });
            if (userByNick) return res.status(400).json({ msg: 'Username taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name,
            email,
            username: username || email.split('@')[0], // Default username
            password: hashedPassword,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        });

        await user.save();

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, username: user.username } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Login (Email OR Username)
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body; // identifier = email or username
    try {
        // Determine if identifier is email or username
        const isEmail = identifier.includes('@');
        const query = isEmail ? { email: identifier } : { username: identifier };

        const user = await User.findOne(query);
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, username: user.username } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Current User
router.get('/me', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Populate friends and requests
        const user = await User.findById(decoded.user.id)
            .select('-password')
            .populate('friends', 'name avatar xp level isPrivate')
            .populate('friendRequests.from', 'name avatar');
        res.json(user);
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
});

module.exports = router;
