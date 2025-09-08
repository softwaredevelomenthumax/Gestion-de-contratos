const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/login
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email using Sequelize's findOne
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Compare the provided password with the stored password (hashed)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate a JWT token using the Sequelize user ID
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });

    // Return the user's profile information and the token
    res.json({
      success: true,
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token,
    }); 
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }
  if (!['regular', 'lawyer'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role.' });
  }
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already registered.' });
    }
    // Create user (password will be hashed by model hook)
    const user = await User.create({ firstName, lastName, email, password, role });
    res.status(201).json({ success: true, message: 'User registered successfully.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;