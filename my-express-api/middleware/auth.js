const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the Sequelize User model

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    // Check if Authorization header exists and has correct format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided or invalid format.',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({ 
          error: 'Token verification failed.',
          code: 'TOKEN_VERIFICATION_FAILED'
        });
      }
    }

    // Find the user by ID using Sequelize's findByPk
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ 
        error: 'User not found. Please login again.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Debug logging to track authentication issues
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error during authentication.',
      code: 'AUTH_SERVER_ERROR'
    });
  }
};

module.exports = auth;