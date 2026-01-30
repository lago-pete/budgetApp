const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to verify token (simplified inline)
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
const jwt = require('jsonwebtoken');


// Get all users (for searching friends)
router.get('/', auth, async (req, res) => {
    try {
        // Exclude current user and already friends
        const currentUser = await User.findById(req.user.id);
        const users = await User.find({
            _id: { $ne: req.user.id, $nin: currentUser.friends }
        }).select('name avatar xp');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add Friend
router.post('/friends/:friendId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const friend = await User.findById(req.params.friendId);

        if (!friend) return res.status(404).json({ msg: 'User not found' });

        if (!user.friends.includes(req.params.friendId)) {
            user.friends.push(req.params.friendId);
            await user.save();
        }

        // Reciprocal (optional, but good for social)
        if (!friend.friends.includes(req.user.id)) {
            friend.friends.push(req.user.id);
            await friend.save();
        }

        res.json(user.friends);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Remove Friend
router.delete('/friends/:friendId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.friends = user.friends.filter(id => id.toString() !== req.params.friendId);
        await user.save();

        // Remove reciprocal
        const friend = await User.findById(req.params.friendId);
        if (friend) {
            friend.friends = friend.friends.filter(id => id.toString() !== req.user.id);
            await friend.save();
        }

        res.json(user.friends);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get User Profile by ID (Public view)
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -friends'); // Don't show their friends list per se, privacy
        if (!user) return res.status(404).json({ msg: 'Profile not found' });
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
