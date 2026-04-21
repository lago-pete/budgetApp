const mongoose = require('mongoose');

const ChallengeParticipationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    challenge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    progressPercent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ['joined', 'completed'],
        default: 'joined'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: {
        type: Date,
        default: null
    }
});

ChallengeParticipationSchema.index({ user: 1, challenge: 1 }, { unique: true });

module.exports = mongoose.model('ChallengeParticipation', ChallengeParticipationSchema);
