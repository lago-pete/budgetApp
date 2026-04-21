const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const ChallengeParticipation = require('../models/ChallengeParticipation');
const User = require('../models/User');
const { auth, adminAuth, premiumOrAdmin } = require('../middleware/auth');

const clampProgress = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 0;
    return Math.max(0, Math.min(100, Math.round(numeric)));
};

// @route   GET /api/challenges
// @desc    Get all challenges
// @access  Premium/Admin
router.get('/', [auth, premiumOrAdmin], async (req, res) => {
    try {
        const challenges = await Challenge.find().sort({ isActive: -1, participantsCount: -1 });
        const participations = await ChallengeParticipation.find({ user: req.user.id })
            .select('challenge progressPercent status joinedAt completedAt');

        const participationMap = participations.reduce((acc, participation) => {
            acc[participation.challenge.toString()] = participation;
            return acc;
        }, {});

        res.json(challenges.map(challenge => {
            const participation = participationMap[challenge._id.toString()];
            return {
                ...challenge.toObject(),
                participation: participation ? {
                    progressPercent: participation.progressPercent,
                    status: participation.status,
                    joinedAt: participation.joinedAt,
                    completedAt: participation.completedAt
                } : null
            };
        }));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.get('/my', [auth, premiumOrAdmin], async (req, res) => {
    try {
        const participations = await ChallengeParticipation.find({ user: req.user.id })
            .populate('challenge')
            .sort({ joinedAt: -1 });

        res.json(participations
            .filter(participation => participation.challenge)
            .map(participation => ({
                ...participation.challenge.toObject(),
                participation: {
                    progressPercent: participation.progressPercent,
                    status: participation.status,
                    joinedAt: participation.joinedAt,
                    completedAt: participation.completedAt
                }
            })));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

router.post('/:id/join', [auth, premiumOrAdmin], async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ msg: 'Challenge not found' });

        let participation = await ChallengeParticipation.findOne({
            user: req.user.id,
            challenge: challenge.id
        });

        if (!participation) {
            participation = await ChallengeParticipation.create({
                user: req.user.id,
                challenge: challenge.id
            });
            challenge.participantsCount += 1;
            await challenge.save();
        }

        return res.json({
            ...challenge.toObject(),
            participation: {
                progressPercent: participation.progressPercent,
                status: participation.status,
                joinedAt: participation.joinedAt,
                completedAt: participation.completedAt
            }
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

router.delete('/:id/join', [auth, premiumOrAdmin], async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ msg: 'Challenge not found' });

        const participation = await ChallengeParticipation.findOneAndDelete({
            user: req.user.id,
            challenge: challenge.id
        });

        if (participation) {
            challenge.participantsCount = Math.max(0, challenge.participantsCount - 1);
            await challenge.save();
        }

        return res.json({ msg: 'Challenge left', challengeId: challenge.id });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
    }
});

router.put('/:id/progress', [auth, premiumOrAdmin], async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ msg: 'Challenge not found' });

        const participation = await ChallengeParticipation.findOne({
            user: req.user.id,
            challenge: challenge.id
        });

        if (!participation) {
            return res.status(404).json({ msg: 'Join the challenge before updating progress' });
        }

        const wasAlreadyCompleted = participation.status === 'completed';
        participation.progressPercent = clampProgress(req.body.progressPercent);
        const nowComplete = participation.progressPercent >= 100;
        participation.status = nowComplete ? 'completed' : 'joined';
        participation.completedAt = nowComplete ? new Date() : null;
        await participation.save();

        if (nowComplete && !wasAlreadyCompleted && challenge.reward > 0) {
            await User.findByIdAndUpdate(req.user.id, { $inc: { xp: challenge.reward } });
        }

        return res.json({
            ...challenge.toObject(),
            participation: {
                progressPercent: participation.progressPercent,
                status: participation.status,
                joinedAt: participation.joinedAt,
                completedAt: participation.completedAt
            }
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server Error');
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
        if (reward !== undefined) fields.reward = Number(reward);
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

        await ChallengeParticipation.deleteMany({ challenge: challenge.id });
        await Challenge.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Challenge removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
