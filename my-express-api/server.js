require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001; // Using a different port than React (3000)

//backend port: 3001
//frontend port: 3000
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

// Use CORS and JSON parsing middleware BEFORE your routes
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Connect to PostgreSQL database
const sequelize = require('./config/database');

// Test database connection and sync models
sequelize.authenticate()
  .then(async () => {
    console.log('Database connection established successfully.');
    
    // Sync all models to create tables if they don't exist
    try {
      await sequelize.sync({ alter: true });
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
    console.error('Please make sure PostgreSQL is running and the database credentials are correct.');
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

// Public file download routes (no auth)
app.use('/api/contracts/:id/files', filesRouter);

// Use the contracts router for /api/contracts (auth handled per route)
app.use('/api/contracts', contractsRouter);

// Use the otrosi router for /api/otrosi (auth handled per route)
app.use('/api/otrosi', otrosiRouter);
app.use('/api/traceability', traceabilityRouter);

// Use the profile router for /api/profile (protected)
app.use('/api/profile', auth, profileRouter);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.send('Hello from Express.js Backend!');
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});