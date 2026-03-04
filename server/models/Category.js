const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['income', 'expense'], default: 'expense' },
    color: { type: String, default: '#6366f1' },
    isDefault: { type: Boolean, default: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // null if default
});

module.exports = mongoose.model('Category', CategorySchema);
