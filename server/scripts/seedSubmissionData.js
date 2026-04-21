require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');
const Challenge = require('../models/Challenge');
const ChallengeParticipation = require('../models/ChallengeParticipation');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wealthflow';
const RESET_FULL_DATASET = process.env.RESET_FULL_DATASET === '1' || process.env.RESET_FULL_DATASET === 'true';

const DEFAULT_CATEGORIES = [
    { name: 'Food & Dining', type: 'expense', color: '#ff6b6b', isDefault: true },
    { name: 'Transportation', type: 'expense', color: '#feca57', isDefault: true },
    { name: 'Housing', type: 'expense', color: '#48dbfb', isDefault: true },
    { name: 'Entertainment', type: 'expense', color: '#ff9ff3', isDefault: true },
    { name: 'Health', type: 'expense', color: '#10ac84', isDefault: true },
    { name: 'Salary', type: 'income', color: '#1dd1a1', isDefault: true },
    { name: 'Freelance', type: 'income', color: '#5f27cd', isDefault: true },
    { name: 'Gifts', type: 'income', color: '#ff9ff3', isDefault: true }
];

const CHALLENGE_SEED = [
    { title: 'No Eating Out Week', description: 'Cook all meals at home for 7 days.', reward: 500, isActive: true },
    { title: 'Save $500 this Month', description: 'Put aside $500 into savings.', reward: 750, isActive: true },
    { title: 'Zero Spend Weekend', description: 'Spend $0 on Saturday and Sunday.', reward: 200, isActive: true },
    { title: 'Debt Destroyer', description: 'Pay off $200 of debt extra this month.', reward: 600, isActive: true },
    { title: 'Coffeeless Week', description: 'Skip the coffee shop run for a week.', reward: 100, isActive: true },
    { title: 'Subscription Cull', description: 'Cancel one unused subscription.', reward: 300, isActive: true },
    { title: 'Grocery Run Under $50', description: 'Keep grocery bill under $50.', reward: 150, isActive: false },
    { title: '30 Day Savings Streak', description: 'Save at least $5 every day.', reward: 900, isActive: false },
    { title: 'Sell One Item', description: "Sell something you don't need.", reward: 100, isActive: false },
    { title: 'Invest $100', description: 'Put $100 into an index fund.', reward: 350, isActive: false },
    { title: 'Emergency Fund Starter', description: 'Reach $1000 in emergency fund.', reward: 1000, isActive: false }
];

const ACCOUNTS = [
    {
        name: 'System Admin',
        email: 'admin@wealthflow.com',
        username: 'admin',
        password: 'admin',
        role: 'admin',
        isPremium: true,
        xp: 5000,
        bio: 'Administrative account for WealthFlow.',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Admin',
        categorySeed: [
            { name: 'Salary', type: 'income', color: '#2ecc71' },
            { name: 'Operational Budget', type: 'expense', color: '#34495e' },
            { name: 'Compliance', type: 'expense', color: '#8e44ad' }
        ],
        transactionSeed: [
            { title: 'Admin Salary', amount: 6200, type: 'income', category: 'Salary', date: '2026-04-01T10:00:00.000Z', notes: 'Monthly salary.' },
            { title: 'Compliance Tooling', amount: 240, type: 'expense', category: 'Compliance', date: '2026-04-03T15:15:00.000Z', notes: 'Security reporting subscription.' }
        ]
    },
    {
        name: 'Premium User',
        email: 'premium@wealthflow.com',
        username: 'premiumuser',
        password: 'premium123',
        role: 'user',
        isPremium: true,
        xp: 2300,
        bio: 'Premium member used for grading challenge features.',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Premium',
        categorySeed: [
            { name: 'Salary', type: 'income', color: '#2ecc71' },
            { name: 'Freelance', type: 'income', color: '#3498db' },
            { name: 'Food', type: 'expense', color: '#e74c3c' },
            { name: 'Rent', type: 'expense', color: '#9b59b6' },
            { name: 'Transport', type: 'expense', color: '#f1c40f' },
            { name: 'Entertainment', type: 'expense', color: '#e67e22' },
            { name: 'Utilities', type: 'expense', color: '#34495e' },
            { name: 'Health', type: 'expense', color: '#10ac84' }
        ],
        transactionSeed: [
            { title: 'Monthly Salary', amount: 5400, type: 'income', category: 'Salary', date: '2026-04-01T12:00:00.000Z', notes: 'Primary paycheck.' },
            { title: 'Website Client', amount: 700, type: 'income', category: 'Freelance', date: '2026-04-05T17:00:00.000Z', notes: 'Freelance side project.' },
            { title: 'Groceries', amount: 132, type: 'expense', category: 'Food', date: '2026-04-06T20:00:00.000Z', notes: 'Weekly groceries.' },
            { title: 'Rent April', amount: 1650, type: 'expense', category: 'Rent', date: '2026-04-02T08:30:00.000Z', notes: 'Monthly rent payment.' },
            { title: 'Bus Pass', amount: 48, type: 'expense', category: 'Transport', date: '2026-04-07T09:00:00.000Z', notes: 'Local transit card refill.' },
            { title: 'Streaming Bundle', amount: 25, type: 'expense', category: 'Entertainment', date: '2026-04-08T11:00:00.000Z', notes: 'Entertainment subscriptions.' },
            { title: 'Electric Bill', amount: 96, type: 'expense', category: 'Utilities', date: '2026-04-10T18:00:00.000Z', notes: 'City electric utility.' },
            { title: 'Pharmacy', amount: 22, type: 'expense', category: 'Health', date: '2026-04-11T14:00:00.000Z', notes: 'Prescription refill.' }
        ]
    },
    {
        name: 'Basic User',
        email: 'basic@wealthflow.com',
        username: 'basicuser',
        password: 'basic123',
        role: 'user',
        isPremium: false,
        xp: 420,
        bio: 'Basic account used for role-gating checks.',
        avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Basic',
        categorySeed: [
            { name: 'Salary', type: 'income', color: '#2ecc71' },
            { name: 'Food', type: 'expense', color: '#e74c3c' },
            { name: 'Rent', type: 'expense', color: '#9b59b6' },
            { name: 'Transport', type: 'expense', color: '#f1c40f' },
            { name: 'Utilities', type: 'expense', color: '#34495e' }
        ],
        transactionSeed: [
            { title: 'Part-time Income', amount: 1900, type: 'income', category: 'Salary', date: '2026-04-01T09:00:00.000Z', notes: 'Part-time pay.' },
            { title: 'Rent April', amount: 980, type: 'expense', category: 'Rent', date: '2026-04-02T08:00:00.000Z', notes: 'Monthly rent payment.' },
            { title: 'Groceries', amount: 88, type: 'expense', category: 'Food', date: '2026-04-06T19:00:00.000Z', notes: 'Weekly groceries.' },
            { title: 'Gas', amount: 62, type: 'expense', category: 'Transport', date: '2026-04-07T17:00:00.000Z', notes: 'Fuel refill.' },
            { title: 'Internet Bill', amount: 54, type: 'expense', category: 'Utilities', date: '2026-04-09T10:00:00.000Z', notes: 'Monthly internet service.' }
        ]
    }
];

const getUserByUsername = async (username) => User.findOne({ username });

async function upsertUser(account) {
    const hashedPassword = await bcrypt.hash(account.password, 10);
    await User.findOneAndUpdate(
        { email: account.email },
        {
            $set: {
                name: account.name,
                email: account.email,
                username: account.username,
                password: hashedPassword,
                role: account.role,
                isPremium: account.isPremium,
                xp: account.xp,
                bio: account.bio,
                avatar: account.avatar,
                useTransactionTemplates: true
            }
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true
        }
    );

    return getUserByUsername(account.username);
}

async function seedCategoriesForUser(user, categories) {
    await Category.deleteMany({ user: user._id });

    const docs = categories.map((category) => ({
        ...category,
        user: user._id,
        isDefault: false
    }));

    await Category.insertMany(docs);
}

async function seedTransactionsForUser(user, transactions) {
    await Transaction.deleteMany({ user: user._id });

    const docs = transactions.map((transaction) => ({
        ...transaction,
        date: new Date(transaction.date),
        user: user._id
    }));

    await Transaction.insertMany(docs);
}

async function seedDefaults() {
    await Category.deleteMany({ isDefault: true, $or: [{ user: { $exists: false } }, { user: null }] });
    await Category.insertMany(DEFAULT_CATEGORIES);

    for (const challenge of CHALLENGE_SEED) {
        await Challenge.updateOne(
            { title: challenge.title },
            {
                $set: {
                    description: challenge.description,
                    reward: challenge.reward,
                    isActive: challenge.isActive
                },
                $setOnInsert: {
                    participantsCount: 0
                }
            },
            { upsert: true }
        );
    }
}

async function seedChallengeParticipation(usersByName) {
    await ChallengeParticipation.deleteMany({
        user: { $in: Object.values(usersByName).map((user) => user._id) }
    });

    const noEatingOut = await Challenge.findOne({ title: 'No Eating Out Week' });
    const save500 = await Challenge.findOne({ title: 'Save $500 this Month' });

    if (noEatingOut && save500) {
        await ChallengeParticipation.insertMany([
            {
                user: usersByName.premiumuser._id,
                challenge: noEatingOut._id,
                progressPercent: 100,
                status: 'completed',
                joinedAt: new Date('2026-04-03T09:00:00.000Z'),
                completedAt: new Date('2026-04-10T18:00:00.000Z')
            },
            {
                user: usersByName.premiumuser._id,
                challenge: save500._id,
                progressPercent: 60,
                status: 'joined',
                joinedAt: new Date('2026-04-05T12:00:00.000Z'),
                completedAt: null
            }
        ]);
    }

    const challengeCounts = await ChallengeParticipation.aggregate([
        { $group: { _id: '$challenge', count: { $sum: 1 } } }
    ]);

    await Challenge.updateMany({}, { participantsCount: 0 });
    for (const row of challengeCounts) {
        await Challenge.updateOne({ _id: row._id }, { $set: { participantsCount: row.count } });
    }
}

async function maybeResetDataset() {
    if (!RESET_FULL_DATASET) return;

    await Promise.all([
        ChallengeParticipation.deleteMany({}),
        Transaction.deleteMany({}),
        Category.deleteMany({}),
        Challenge.deleteMany({}),
        User.deleteMany({})
    ]);
}

async function run() {
    await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log(`[seedSubmissionData] Connected: ${MONGO_URI}`);

    await maybeResetDataset();
    await seedDefaults();

    const usersByName = {};
    for (const account of ACCOUNTS) {
        const user = await upsertUser(account);
        usersByName[account.username] = user;
        await seedCategoriesForUser(user, account.categorySeed);
        await seedTransactionsForUser(user, account.transactionSeed);
    }

    await seedChallengeParticipation(usersByName);

    await ChallengeParticipation.syncIndexes();

    const userCount = await User.countDocuments({});
    const categoryCount = await Category.countDocuments({});
    const transactionCount = await Transaction.countDocuments({});
    const challengeCount = await Challenge.countDocuments({});
    const participationCount = await ChallengeParticipation.countDocuments({});

    console.log('[seedSubmissionData] Complete');
    console.log(`[seedSubmissionData] users=${userCount}, categories=${categoryCount}, transactions=${transactionCount}, challenges=${challengeCount}, challengeparticipations=${participationCount}`);

    await mongoose.disconnect();
}

run().catch(async (err) => {
    console.error('[seedSubmissionData] Failed:', err);
    try {
        await mongoose.disconnect();
    } catch (disconnectErr) {
        console.error('[seedSubmissionData] Disconnect failed:', disconnectErr);
    }
    process.exit(1);
});
