const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    bio: { type: String, default: "" },
    avatar: { type: String, default: "https://ui-avatars.com/api/?background=random" },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{
        name: String,
        icon: String,
        dateEarned: { type: Date, default: Date.now }
    }],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['pending', 'rejected'], default: 'pending' },
        date: { type: Date, default: Date.now }
    }],
    transactionTemplates: [{
        name: String, // Preset Name "Weekly Grocery"
        title: String,
        amount: Number,
        type: String,
        category: String
    }],
    goals: [{ type: String }],
    role: { type: String, default: 'user' },
    isPrivate: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
