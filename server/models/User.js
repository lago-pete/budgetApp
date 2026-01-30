const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: "https://ui-avatars.com/api/?background=random" },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{
        name: String,
        icon: String,
        dateEarned: { type: Date, default: Date.now }
    }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    goals: [{ type: String }], // Simple array of strings for now
    role: { type: String, default: 'user' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
