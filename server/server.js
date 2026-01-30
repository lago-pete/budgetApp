const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./models/User');
const Category = require('./models/Category');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/uploads', require('./routes/uploads'));

// Other Routes (Inline for now or refactor later)
const Transaction = require('./models/Transaction');
const Challenge = require('./models/Challenge');

// Transaction Routes (Updated with User Auth)
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

app.get('/api/transactions', auth, async (req, res) => {
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
});

app.post('/api/transactions', auth, async (req, res) => {
    const { title, amount, type, category, proofUrl } = req.body;
    const newTx = new Transaction({
        title, amount, type, category, proofUrl,
        user: req.user.id
    });
    await newTx.save();
    res.json(newTx);
});

// Public Challenge Routes
app.get('/api/challenges', async (req, res) => {
    const challenges = await Challenge.find();
    res.json(challenges);
});


// Database Connection & Seeding
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wealthflow', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        console.log('MongoDB Connected');
        seedDefaultCategories();
    })
    .catch(err => console.log(err));

async function seedDefaultCategories() {
    const count = await Category.countDocuments({ isDefault: true });
    if (count === 0) {
        const defaults = [
            { name: 'Food & Dining', type: 'expense', color: '#ff6b6b', isDefault: true },
            { name: 'Transportation', type: 'expense', color: '#feca57', isDefault: true },
            { name: 'Housing', type: 'expense', color: '#48dbfb', isDefault: true },
            { name: 'Entertainment', type: 'expense', color: '#ff9ff3', isDefault: true },
            { name: 'Salary', type: 'income', color: '#1dd1a1', isDefault: true },
            { name: 'Freelance', type: 'income', color: '#5f27cd', isDefault: true },
        ];
        await Category.insertMany(defaults);
        console.log('Default Categories seeded');
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
