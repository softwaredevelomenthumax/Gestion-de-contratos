const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid token.' });
    }

    if (user.status !== 'approved') {
      return res.status(403).json({ success: false, error: 'Account not approved.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied. Admin privileges required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({ success: false, error: 'Invalid token.' });
  }
};

module.exports = adminAuth;
