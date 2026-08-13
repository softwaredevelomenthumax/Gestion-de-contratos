const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const { normalizeCountryCode, normalizeLanguageCode, compatibleCountryCodes } = require('../utils/countries');
const { fn, col, where } = require('sequelize');

const ALLOWED_COUNTRY_CODES = ['CO', 'US', 'MX', 'AR', 'PE', 'CL', 'EC'];
const ALLOWED_LANGUAGES = ['es', 'en'];

// POST /api/login
router.post('/', async (req, res) => {
  const { email, password } = req.body;

  // Normalize incoming email for lookup to avoid case-sensitivity mismatches
  const normalizedEmail = String(email || '').trim().toLowerCase();

  // Debugging/logging: capture attempts to diagnose language-dependent login failures.
  try {
    const headersToLog = {
      'accept-language': req.headers['accept-language'],
      host: req.headers.host,
      'user-agent': req.headers['user-agent']
    };
    console.log('🛈 Login attempt:', { rawEmail: String(email || ''), normalizedEmail, hasPassword: !!password, headers: headersToLog });
  } catch (logErr) {
    console.error('Error logging login attempt:', logErr);
  }

  try {
    // Find the user by email using Sequelize's findOne
    // Use a case-insensitive lookup by applying LOWER(email) in SQL to avoid
    // mismatches when the DB collation or stored case differs from the input.
    const user = await User.findOne({ where: where(fn('lower', col('email')), normalizedEmail) });

    if (!user) {
      console.warn('🔒 Login failed: user not found for', normalizedEmail);
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    // Check if user account is approved
    if (user.status !== 'approved') {
      if (user.status === 'pending') {
        return res.status(403).json({ success: false, error: 'Tu cuenta está pendiente de aprobación. Por favor espera a que un administrador apruebe tu cuenta.' });
      } else if (user.status === 'rejected') {
        return res.status(403).json({ success: false, error: 'Tu cuenta ha sido rechazada. Por favor contacta a un administrador.' });
      }
    }

    // Compare the provided password with the stored password (hashed)
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.warn('🔒 Login failed: invalid password for', normalizedEmail);
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }


    // Generate a JWT token using the Sequelize user ID
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '24h' });

    const normalizedCountryCode = normalizeCountryCode(user.countryCode) || 'CO';
    const normalizedLanguage = normalizeLanguageCode(user.preferredLanguage);

    console.log('✅ Login successful for user id', user.id, 'email', user.email);
    // Return the user's profile information and the token
    res.json({
      success: true,
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role || 'regular',
      countryCode: normalizedCountryCode,
      preferredLanguage: normalizedLanguage,
      token,
      status: user.status,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role || 'regular',
        countryCode: normalizedCountryCode,
        preferredLanguage: normalizedLanguage,
        status: user.status,
      }
    }); 
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// POST /api/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, password, role, countryCode, preferredLanguage } = req.body;
  const normalizedCountryCode = normalizeCountryCode(countryCode);
  const normalizedLanguage = normalizeLanguageCode(preferredLanguage);

  if (!firstName || !lastName || !email || !password || !role || !normalizedCountryCode) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos.' });
  }
  if (!['regular', 'lawyer'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Rol inválido.' });
  }
  if (!ALLOWED_COUNTRY_CODES.includes(normalizedCountryCode)) {
    return res.status(400).json({ success: false, error: 'Código de país inválido.' });
  }
  if (!ALLOWED_LANGUAGES.includes(normalizedLanguage)) {
    return res.status(400).json({ success: false, error: 'Idioma inválido.' });
  }
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'El correo electrónico ya está registrado.' });
    }
    // Create user with pending status (password will be hashed by model hook)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      status: 'pending',
      countryCode: normalizedCountryCode,
      preferredLanguage: normalizedLanguage
    });
    
    // Enviar notificación de registro al usuario
    try {
      await emailService.sendUserRegistrationNotification(user.email, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        countryCode: user.countryCode
      });
      console.log('✅ Email de registro enviado a:', user.email);
    } catch (emailError) {
      console.error('❌ Error enviando email de registro:', emailError);
      // No fallar el registro por un error de email
    }

    // Notificar a los administradores sobre el nuevo usuario
    try {
      const admins = await User.findAll({
        where: { role: 'admin', status: 'approved', countryCode: compatibleCountryCodes(user.countryCode) },
        attributes: ['email']
      });
      
      if (admins.length > 0) {
        const adminEmails = admins.map(admin => admin.email);
        await emailService.sendAdminNewUserNotification(adminEmails, {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          countryCode: user.countryCode
        });
        console.log('✅ Email de nuevo usuario enviado a administradores:', adminEmails);
      }
    } catch (emailError) {
      console.error('❌ Error enviando email a administradores:', emailError);
    }
    
    res.status(201).json({ success: true, message: 'Usuario registrado exitosamente. Tu cuenta está pendiente de aprobación por un administrador.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;
