const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    participantsCount: { type: Number, default: 0 },
    reward: String,
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
