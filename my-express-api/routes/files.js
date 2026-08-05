const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth');

router.use(auth);
const multer = require('multer');
const path = require('path');
const ContractFile = require('../models/ContractFile');
const { Contract } = require('../models/Contract');
const fs = require('fs');
const googleDriveService = require('../services/googleDrive');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
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

// GET /api/contracts/:contractId/files
router.get('/', async (req, res) => {
  const contractId = req.params.id;
  if (isNaN(Number(contractId))) {
    return res.status(400).json({ error: 'Invalid contract id' });
  }
  try {
    const files = await ContractFile.findAll({
      where: { contractId: contractId },
      attributes: ['id', 'filename', 'filepath', 'category', 'fileType', 'responseType', 'contractId', 'created_at', 'updated_at'], // Incluir nuevos campos
      include: [{ model: Contract, as: 'associatedContract' }],
      order: [['created_at', 'DESC']], // Ordenar por fecha de creación, más reciente primero
    });
    console.log('Files with timestamps:', JSON.stringify(files, null, 2)); // Debug log
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contracts/:contractId/files
router.post('/', upload.single('file'), async (req, res) => {
  const contractId = req.params.id;
  if (isNaN(Number(contractId))) {
    return res.status(400).json({ error: 'Invalid contract id' });
  }
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload file to Google Drive directly from memory buffer - no temp files!
    const driveFile = await googleDriveService.uploadContractFileFromBuffer(
      req.file.buffer,
      contractId,
      req.file.originalname,
      req.body.category || req.body.type || 'contrato'
    );

    // No temporary files to clean up - using memory storage! 🎉

    const file = await ContractFile.create({
      filename: req.file.originalname,
      filepath: driveFile.id, // Store Google Drive file ID instead of local path
      contractId: contractId,
      category: req.body.category || req.body.type || 'contrato',
      fileType: ContractFile.determineFileType(req.user.role, 'upload', req.body.category || req.body.type, req.file.originalname),
      responseType: req.user.role === 'lawyer' ? 'lawyer' : 'user',
      driveFileId: driveFile.id, // Store the Google Drive file ID
      driveWebViewLink: driveFile.webViewLink,
      driveWebContentLink: driveFile.webContentLink,
    });
    res.status(201).json(file);
  } catch (error) {
    console.error('Error uploading file:', error);
    // No temporary files to clean up - using memory storage! 🎉
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/contracts/:contractId/files/:fileId
router.get('/:fileId', async (req, res) => {
  const contractId = req.params.id;
  const fileId = req.params.fileId;
  if (isNaN(Number(contractId)) || isNaN(Number(fileId))) {
    return res.status(400).json({ error: 'Invalid contract or file id' });
  }
  try {
    const file = await ContractFile.findOne({
      where: { id: fileId, contractId: contractId },
      include: [{ model: Contract, as: 'associatedContract' }],
    });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/contracts/:id/files/:fileId/download
router.get('/:fileId/download', async (req, res) => {
  try {
    const { id: contractId, fileId } = req.params;
    
    // Verificar que el contrato existe y el usuario tiene acceso
    const contract = await Contract.findByPk(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Verificar permisos: el usuario debe ser el solicitante o un abogado
    if (req.user.role !== 'lawyer' && contract.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para descargar este archivo' });
    }
    
    // Verificar que el archivo pertenece al contrato
    const file = await ContractFile.findOne({
      where: { id: fileId, contractId: contractId }
    });
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Download file from Google Drive
    const fileStream = await googleDriveService.getFileStream(file.driveFileId || file.filepath);

    // Set headers for file download
    res.setHeader('Content-Type', '.pdf .doc .docx');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);

    // Pipe the file stream to response
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/contracts/:contractId/files/:fileId
router.delete('/:fileId', async (req, res) => {
  const contractId = req.params.id;
  const fileId = req.params.fileId;
  if (isNaN(Number(contractId)) || isNaN(Number(fileId))) {
    return res.status(400).json({ error: 'Invalid contract or file id' });
  }
  try {
    const file = await ContractFile.findOne({ where: { id: fileId, contractId: contractId } });
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    // Delete file from Google Drive if driveFileId exists
    if (file.driveFileId) {
      await googleDriveService.deleteFile(file.driveFileId);
    } else if (fs.existsSync(file.filepath)) {
      // Fallback to local file deletion for legacy files
      fs.unlinkSync(file.filepath);
    }
    await file.destroy();
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;