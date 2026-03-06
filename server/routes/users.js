const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const { auth, adminAuth } = require('../middleware/auth');


// Get All Users (Admin Only)
router.get('/admin/all', [auth, adminAuth], async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete User (Admin Only)
router.delete('/admin/:id', [auth, adminAuth], async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) return res.status(404).json({ msg: 'User not found' });

        // Prevent admin from deleting themselves
        if (userToDelete.id === req.user.id) {
            return res.status(400).json({ msg: 'Admins cannot delete themselves' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});
// Get All Users for Leaderboard
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find().select('name avatar xp level isPremium username _id');
        res.json(users);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.put('/bio', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.bio = req.body.bio;
        await user.save();
        res.json({ bio: user.bio });
    } catch (err) { res.status(500).send('Server Error'); }
});

router.put('/templates', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.useTransactionTemplates = !user.useTransactionTemplates;
        await user.save();
        res.json({ useTransactionTemplates: user.useTransactionTemplates });
    } catch (err) { res.status(500).send('Server Error'); }
});

// Toggle Premium Status
router.put('/status', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.isPremium = !user.isPremium;
        await user.save();
        res.json(user);
    } catch (err) { res.status(500).send('Server Error'); }
});


// --- TEMPLATE ROUTES ---
router.get('/templates', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.transactionTemplates || []);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/templates', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.transactionTemplates.push(req.body);
        await user.save();
        res.json(user.transactionTemplates);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.delete('/templates/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.transactionTemplates.id(req.params.id).deleteOne();
        await user.save();
        res.json(user.transactionTemplates);
    } catch (err) { res.status(500).send('Server Error'); }
});
// -----------------------

router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'Profile not found' });

        if (req.params.id !== req.user.id && !user.isPremium) {
            return res.json({
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
                isPremium: false,
                bio: user.bio,
                msg: "This profile is basic and private."
            });
        }
        res.json(user);
    } catch (err) { res.status(500).send('Server Error'); }
});

// Update Profile (Name & Bio)
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, bio } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name) user.name = name;
        if (bio !== undefined) user.bio = bio;

        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
