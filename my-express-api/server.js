require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001; // Using a different port than React (3000)

// 🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO

//backend port: 3001
//frontend port: 3000

// 📊 ENDPOINT PARA VERIFICAR VARIABLES DE ENTORNO EN TIEMPO REAL
app.get('/api/env-check', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    env_status: {
      FRONTEND_URL: process.env.FRONTEND_URL || '❌ NO CARGADO',
      DB_HOST: process.env.DB_HOST || '❌ NO CARGADO',
      PORT: process.env.PORT || '❌ NO CARGADO',
      SMTP_HOST: process.env.SMTP_HOST || '❌ NO CARGADO',
      SMTP_PORT: process.env.SMTP_PORT || '❌ NO CARGADO',
      FROM_EMAIL: process.env.FROM_EMAIL || '❌ NO CARGADO'
    },
    server_info: {
      port: port,
      env_file_path: __dirname + '/.env',
      node_version: process.version,
      platform: process.platform
    }
  });
});

// Configure JSON parsing middleware BEFORE routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📧 ENDPOINT PARA PROBAR FUNCIONALIDAD DE EMAIL
app.post('/api/test-email', async (req, res) => {
  try {
    const emailService = require('./services/emailService');
    const { to, subject, message } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campos requeridos: to, subject, message' 
      });
    }

    // Test connection first
    const connectionTest = await emailService.testConnection();
    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        error: 'Email service connection failed',
        details: connectionTest.error
      });
    }

    // Send test email
    const result = await emailService.sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #2563eb; margin-bottom: 20px;">🧪 Email de Prueba</h2>
            <div style="background-color: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
              <p style="color: #374151; margin-bottom: 15px;">${message}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Este es un email de prueba del Sistema de Gestión de Contratos.
            </p>
          </div>
        </div>
      `
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Email de prueba enviado exitosamente',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Error enviando email de prueba',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, DOC and DOCX files are allowed'));
    }

    cb(null, true);
  }
});

// Use CORS and JSON parsing middleware BEFORE your routes (restrict to known frontends)
const allowedOrigins = [
  'http://localhost:5173',
  'http://10.255.6.4:5173'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicitly handle preflight in Express v5 without path patterns
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
// JSON parsing already configured above

// Connect to SQL Server database
const sequelize = require('./config/database');

// Test database connection and sync models
sequelize.authenticate()
  .then(async () => {
    console.log('Database connection established successfully.');
    
    // Sync all models to create tables if they don't exist
    try {
      // Use { force: false } to avoid altering existing tables
      await sequelize.sync({ force: false });
      console.log('Database models synchronized successfully.');
      
      // Seed admin user if none exists
      const User = require('./models/User');
      const existingAdmin = await User.findOne({ where: { role: 'admin' } });
      
      if (!existingAdmin) {
        await User.create({
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin',
          status: 'approved'
        });
        console.log('✅ Admin user created: admin@example.com / admin123');
      }
      
      // Start server after successful sync
      app.listen(port, () => {
        console.log(`Server running on port ${port}`);
      });
    } catch (syncError) {
      console.error('Error syncing database models:', syncError);
      console.error('Server will not start due to database sync failure.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
    console.error('Please make sure SQL Server is running and the database credentials are correct.');
    process.exit(1);
  });

// Import the contracts, files, profile, and login routers
const contractsRouter = require('./routes/contracts');
const profileRouter = require('./routes/profile');
const loginRouter = require('./routes/login');
const filesRouter = require('./routes/files');
const otrosiRouter = require('./routes/otrosi');
const traceabilityRouter = require('./routes/traceability');
const adminRouter = require('./routes/admin');


// Import the authentication middleware
const auth = require('./middleware/auth');

// Import Sequelize models
const User = require('./models/User');
const { Contract } = require('./models/Contract');
const ContractFile = require('./models/ContractFile');
const ContractHistory = require('./models/ContractHistory');
const RejectedUser = require('./models/RejectedUser');
require('./models/associations');

// Use the login router (public route)
app.use('/api/login', loginRouter);

// Use the contracts router for /api/contracts (auth handled per route)
app.use('/api/contracts', contractsRouter);

// Use the otrosi router for /api/otrosi (auth handled per route)
app.use('/api/otrosi', otrosiRouter);
app.use('/api/traceability', traceabilityRouter);

// Use the profile router for /api/profile (protected)
app.use('/api/profile', auth, profileRouter);

// Use the admin router for /api/admin (admin-protected)
app.use('/api/admin', adminRouter);

// Serve uploaded files - DISABLED for Google Drive migration
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Hello from Express.js Backend!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || '¡Algo salió mal!' });
});