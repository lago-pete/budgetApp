const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => process.env.JWT_SECRET || 'secret';

const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

const adminAuth = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied: Admin only' });
        }
        next();
    } catch (err) {
        res.status(500).send('Server Error');
    }
};

const premiumOrAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('role isPremium');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.role === 'admin' || user.isPremium) {
            req.currentUser = user;
            return next();
        }

        return res.status(403).json({ msg: 'Premium access required' });
    } catch (err) {
        return res.status(500).send('Server Error');
    }
};

module.exports = { auth, adminAuth, premiumOrAdmin, getJwtSecret };
