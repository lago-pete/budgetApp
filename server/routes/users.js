const express = require('express');
const router = express.Router();
const User = require('../models/User');
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

const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Admin only' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server Error');
    }
};


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
// Search Users
router.get('/', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const users = await User.find({
            _id: { $ne: req.user.id, $nin: currentUser.friends }
        }).select('name avatar xp level isPrivate username');
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

router.post('/request/:id', auth, async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ msg: 'User not found' });
        if (targetUser.friendRequests.find(r => r.from.toString() === req.user.id)) return res.status(400).json({ msg: 'Request already sent' });
        if (targetUser.friends.includes(req.user.id)) return res.status(400).json({ msg: 'Already friends' });

        targetUser.friendRequests.push({ from: req.user.id });
        await targetUser.save();
        res.json({ msg: 'Request sent' });
    } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/request/accept/:requestId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const reqItem = user.friendRequests.id(req.params.requestId);
        if (!reqItem) return res.status(404).json({ msg: 'Request not found' });
        const newFriendId = reqItem.from;

        user.friends.push(newFriendId);
        reqItem.deleteOne();
        await user.save();

        const otherUser = await User.findById(newFriendId);
        if (!otherUser.friends.includes(user.id)) {
            otherUser.friends.push(user.id);
            await otherUser.save();
        }

        const updatedUser = await User.findById(req.user.id)
            .populate('friends', 'name avatar xp level')
            .populate('friendRequests.from', 'name avatar');
        res.json(updatedUser);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.post('/request/reject/:requestId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.friendRequests.id(req.params.requestId).deleteOne();
        await user.save();
        const updatedUser = await User.findById(req.user.id).populate('friendRequests.from', 'name avatar');
        res.json(updatedUser);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.put('/privacy', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.isPrivate = !user.isPrivate;
        await user.save();
        res.json({ isPrivate: user.isPrivate });
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

router.put('/settings', auth, async (req, res) => {
    try {
        const { verifyToDelete } = req.body;
        const user = await User.findById(req.user.id);
        if (typeof verifyToDelete === 'boolean') {
            user.verifyToDelete = verifyToDelete;
        }
        await user.save();
        res.json(user);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.get('/friends', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'name avatar xp level isPrivate');
        res.json(user.friends);
    } catch (err) { res.status(500).send('Server Error'); }
});

router.delete('/friends/:friendId', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.friends = user.friends.filter(id => id.toString() !== req.params.friendId);
        await user.save();
        const friend = await User.findById(req.params.friendId);
        if (friend) {
            friend.friends = friend.friends.filter(id => id.toString() !== req.user.id);
            await friend.save();
        }
        res.json(user.friends);
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
        const currentUser = await User.findById(req.user.id);
        const isFriend = currentUser.friends.includes(req.params.id);

        if (req.params.id !== req.user.id && user.isPrivate && !isFriend) {
            return res.json({
                _id: user._id,
                name: user.name,
                avatar: user.avatar,
                isPrivate: true,
                bio: user.bio,
                msg: "This profile is private."
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
