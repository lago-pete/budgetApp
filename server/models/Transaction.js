const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true }, // Store Name or ID. Ideally ID but for simplicity Name is used in code
    date: { type: Date, default: Date.now },
    proofUrl: String,
    notes: String
});

module.exports = mongoose.model('Transaction', TransactionSchema);
