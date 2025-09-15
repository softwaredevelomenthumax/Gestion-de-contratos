require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001; // Using a different port than React (3000)

// 🔍 VERIFICACIÓN DE VARIABLES DE ENTORNO
console.log('🔍 VERIFICACIÓN DE .env AL INICIAR SERVIDOR:');
console.log('🌐 FRONTEND_URL:', process.env.FRONTEND_URL || '❌ NO CARGADO');
console.log('📊 DB_HOST:', process.env.DB_HOST || '❌ NO CARGADO');
console.log('🔗 Puerto del servidor:', port);
console.log('📂 .env path:', __dirname + '/.env');
console.log('');

//backend port: 3001
//frontend port: 3000

// 📊 ENDPOINT PARA VERIFICAR VARIABLES DE ENTORNO EN TIEMPO REAL
app.get('/api/env-check', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    env_status: {
      FRONTEND_URL: process.env.FRONTEND_URL || '❌ NO CARGADO',
      DB_HOST: process.env.DB_HOST || '❌ NO CARGADO',
      PORT: process.env.PORT || '❌ NO CARGADO'
    },
    server_info: {
      port: port,
      env_file_path: __dirname + '/.env',
      node_version: process.version,
      platform: process.platform
    }
  });
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
    // Only accept PDF files
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// Use CORS and JSON parsing middleware BEFORE your routes (permissive for corp network)
app.use(cors({
  origin: true, // reflect request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicitly handle preflight
app.options('*', cors());
app.use(express.json());

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

console.log('🚀 Servidor cargando rutas...');
console.log('📋 Ruta contracts cargada:', contractsRouter ? '✅' : '❌');

// Import the authentication middleware
const auth = require('./middleware/auth');

// Import Sequelize models
const User = require('./models/User');
const { Contract } = require('./models/Contract');
const ContractFile = require('./models/ContractFile');
const ContractHistory = require('./models/ContractHistory');
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

// Serve uploaded files - DISABLED for Google Drive migration
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Hello from Express.js Backend!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});