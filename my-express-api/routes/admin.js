const express = require('express');
const router = express.Router();
const User = require('../models/User');
const RejectedUser = require('../models/RejectedUser');
const adminAuth = require('../middleware/adminAuth');
const emailService = require('../services/emailService');
const { normalizeCountryCode, compatibleCountryCodes } = require('../utils/countries');

const ALLOWED_COUNTRY_CODES = ['CO', 'MX', 'AR', 'PE', 'CL', 'EC'];

// All routes in this file require admin authentication
router.use(adminAuth);

// GET /api/admin/users/pending - Get all pending users
router.get('/users/pending', async (req, res) => {
  try {
    const pendingUsers = await User.findAll({
      where: { status: 'pending', countryCode: compatibleCountryCodes(req.user.countryCode) },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'countryCode'],
      order: [['id', 'DESC']] // Order by ID instead of createdAt
    });

    res.json({
      success: true,
      users: pendingUsers
    });
  } catch (error) {
    console.error('Error fetching pending users:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/admin/users/:id/approve - Approve a pending user
router.post('/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (normalizeCountryCode(user.countryCode) !== normalizeCountryCode(req.user.countryCode)) {
      return res.status(403).json({ success: false, error: 'No puedes aprobar usuarios de otro país.' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'El usuario no está pendiente de aprobación' });
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
      message: 'Usuario aprobado exitosamente',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        countryCode: user.countryCode,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/admin/users/:id/reject - Reject a pending user
router.post('/users/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    if (normalizeCountryCode(user.countryCode) !== normalizeCountryCode(req.user.countryCode)) {
      return res.status(403).json({ success: false, error: 'No puedes rechazar usuarios de otro país.' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'El usuario no está pendiente de aprobación' });
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
      message: 'Usuario rechazado y eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error rejecting user:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/admin/create-admin - Create a new admin user
router.post('/create-admin', async (req, res) => {
  const { firstName, lastName, email, password, countryCode } = req.body;
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  
  if (!firstName || !lastName || !email || !password || !normalizedCountryCode) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos.' });
  }
  if (!ALLOWED_COUNTRY_CODES.includes(normalizedCountryCode)) {
    return res.status(400).json({ success: false, error: 'Código de país inválido.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'El correo electrónico ya está registrado.' });
    }

    const countryAdmin = await User.findOne({
      where: {
        role: 'admin',
        status: 'approved',
        countryCode: compatibleCountryCodes(normalizedCountryCode)
      }
    });
    if (countryAdmin) {
      return res.status(409).json({ success: false, error: `Ya existe un administrador aprobado para ${normalizedCountryCode}.` });
    }

    // Create admin user with approved status
    const adminUser = await User.create({ 
      firstName, 
      lastName, 
      email, 
      password, 
      role: 'admin',
      status: 'approved',
      countryCode: normalizedCountryCode,
      preferredLanguage: 'es'
    });

    res.status(201).json({ 
      success: true, 
      message: 'Usuario administrador creado exitosamente.',
      user: {
        id: adminUser.id,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        email: adminUser.email,
        role: adminUser.role,
        countryCode: adminUser.countryCode,
        status: adminUser.status
      }
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
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
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;

//admin@example.com   admin123
