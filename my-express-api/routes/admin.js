const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RejectedUser = require('../models/RejectedUser');
const adminAuth = require('../middleware/adminAuth');
const emailService = require('../services/emailService');

// All routes in this file require admin authentication
router.use(adminAuth);

// GET /api/admin/users/pending - Get all pending users
router.get('/users/pending', async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { status: 'pending' },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      order: [['id', 'DESC']] // Order by ID instead of createdAt
    });

    res.json({
      success: true,
      users: pendingUsers
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/admin/users/:id/approve - Approve a pending user
router.post('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'User is not pending approval' });
    }

    await user.update({ status: 'approved' });

    // Enviar notificación de aprobación por email
    try {
      await emailService.sendUserApprovalNotification(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      });
      console.log('✅ Email de aprobación enviado a:', user.email);
    } catch (emailError) {
      console.error('❌ Error enviando email de aprobación:', emailError);
      // No fallar la aprobación por un error de email
    }

    res.json({
      success: true,
      message: 'User approved successfully',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/admin/users/:id/reject - Reject a pending user
router.post('/users/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'User is not pending approval' });
    }

    // Enviar notificación de rechazo por email antes de eliminar
    try {
      await emailService.sendUserRejectionNotification(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      });
      console.log('✅ Email de rechazo enviado a:', user.email);
    } catch (emailError) {
      console.error('❌ Error enviando email de rechazo:', emailError);
      // Continuar con el proceso aunque falle el email
    }

    // Save rejected user data before deletion
    await RejectedUser.create({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      rejectedBy: req.user.id
    });

    // Delete the user
    await user.destroy();

    res.json({
      success: true,
      message: 'User rejected and deleted successfully'
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/admin/create-admin - Create a new admin user
router.post('/create-admin', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email already registered.' });
    }

    // Create admin user with approved status
    const adminUser = await User.create({ 
      firstName, 
      lastName, 
      email, 
      password, 
      role: 'admin',
      status: 'approved' 
    });

    res.status(201).json({ 
      success: true, 
      message: 'Admin user created successfully.',
      user: {
        id: adminUser.id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/admin/rejected-users - Get all rejected users (for audit purposes)
router.get('/rejected-users', async (req, res) => {
  try {
    const rejectedUsers = await RejectedUser.findAll({
      include: [{
        model: User,
        as: 'rejector',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['rejectedAt', 'DESC']]
    });

    res.json({
      success: true,
      rejectedUsers
    });
  } catch (error) {
    console.error('Error fetching rejected users:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;

//admin@example.com   admin123