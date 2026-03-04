const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const { auth, adminAuth } = require('../middleware/auth');

// @route   GET /api/challenges
// @desc    Get all challenges
// @access  Public
router.get('/', async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ isActive: -1, participantsCount: -1 });
        res.json(challenges);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/challenges
// @desc    Create a challenge
// @access  Admin Only
router.post('/', [auth, adminAuth], async (req, res) => {
    try {
        const { title, description, reward, isActive } = req.body;
        const newChallenge = new Challenge({
            title,
            description,
            reward,
            isActive: isActive !== undefined ? isActive : true
        });
        const challenge = await newChallenge.save();
        res.json(challenge);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/challenges/:id
// @desc    Update a challenge
// @access  Admin Only
router.put('/:id', [auth, adminAuth], async (req, res) => {
    try {
        const { title, description, reward, isActive, participantsCount } = req.body;
        const fields = {};
        if (title) fields.title = title;
        if (description) fields.description = description;
        if (reward) fields.reward = reward;
        if (isActive !== undefined) fields.isActive = isActive;
        if (participantsCount !== undefined) fields.participantsCount = participantsCount;

        let challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ msg: 'Challenge not found' });

        challenge = await Challenge.findByIdAndUpdate(
            req.params.id,
            { $set: fields },
            { new: true }
        );
        res.json(challenge);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/challenges/:id
// @desc    Delete a challenge
// @access  Admin Only
router.delete('/:id', [auth, adminAuth], async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ msg: 'Challenge not found' });

        await Challenge.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Challenge removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
