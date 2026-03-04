const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const User = require('./models/User');
const Category = require('./models/Category');
const Transaction = require('./models/Transaction');

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
app.use('/api/transactions', require('./routes/transactions'));

// Other Routes (Inline)
const Challenge = require('./models/Challenge');

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
        seedData();
    })
    .catch(err => console.log(err));

async function seedData() {
    // Categories
    const catCount = await Category.countDocuments({ isDefault: true });
    if (catCount === 0) {
        const defaults = [
            { name: 'Food & Dining', type: 'expense', color: '#ff6b6b', isDefault: true },
            { name: 'Transportation', type: 'expense', color: '#feca57', isDefault: true },
            { name: 'Housing', type: 'expense', color: '#48dbfb', isDefault: true },
            { name: 'Entertainment', type: 'expense', color: '#ff9ff3', isDefault: true },
            { name: 'Health', type: 'expense', color: '#10ac84', isDefault: true },
            { name: 'Salary', type: 'income', color: '#1dd1a1', isDefault: true },
            { name: 'Freelance', type: 'income', color: '#5f27cd', isDefault: true },
            { name: 'Gifts', type: 'income', color: '#ff9ff3', isDefault: true },
        ];
        await Category.insertMany(defaults);
        console.log('Default Categories seeded');
    }

    // Challenges - 10+ Seeded
    const challCount = await Challenge.countDocuments();
    if (challCount === 0) {
        const challenges = [
            { title: 'No Eating Out Week', description: "Cook all meals at home for 7 days.", participantsCount: 142, reward: '500 XP', isActive: true },
            { title: 'Save $500 this Month', description: "Put aside $500 into savings.", participantsCount: 320, reward: 'Saver Badge', isActive: true },
            { title: 'Zero Spend Weekend', description: "Spend $0 on Saturday and Sunday.", participantsCount: 89, reward: '200 XP', isActive: true },
            { title: 'Debt Destroyer', description: "Pay off $200 of debt extra this month.", participantsCount: 45, reward: 'Freedom Badge', isActive: true },
            { title: 'Coffeeless Week', description: "Skip the coffee shop run for a week.", participantsCount: 210, reward: '100 XP', isActive: true },
            { title: 'Subscription Cull', description: "Cancel one unused subscription.", participantsCount: 56, reward: 'Smart Badge', isActive: true },
            { title: 'Grocery Run Under $50', description: "Keep grocery bill under $50.", participantsCount: 112, reward: '150 XP', isActive: false },
            { title: '30 Day Savings Streak', description: "Save at least $5 every day.", participantsCount: 78, reward: 'Streak Badge', isActive: false },
            { title: 'Sell One Item', description: "Sell something you don't need.", participantsCount: 34, reward: '100 XP', isActive: false },
            { title: 'Invest $100', description: "Put $100 into an index fund.", participantsCount: 220, reward: 'Investor Badge', isActive: false },
            { title: 'Emergency Fund Starter', description: "Reach $1000 in emergency fund.", participantsCount: 400, reward: 'Safety Badge', isActive: false },
        ];
        await Challenge.insertMany(challenges);
        await Challenge.insertMany(challenges);
        console.log('Challenges seeded');
    }

    // Migration: Rename 'Other' to 'Uncategorized'
    const otherCount = await Transaction.countDocuments({ category: 'Other' });
    if (otherCount > 0) {
        await Transaction.updateMany({ category: 'Other' }, { category: 'Uncategorized' });
        console.log(`Migrated ${otherCount} transactions from 'Other' to 'Uncategorized'`);
    }

    // Seed Admin User
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedAdminPassword = await bcrypt.hash('admin', salt);

        const admin = new User({
            name: 'System Admin',
            email: 'admin@wealthflow.com',
            username: 'admin',
            password: hashedAdminPassword,
            role: 'admin',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin'
        });
        await admin.save();
        console.log('Seed: Admin user created');
    }
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
