const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Contract, ContractViewer } = require('../models/Contract');
const ContractFile = require('../models/ContractFile');
const User = require('../models/User');
const { recordHistory } = require('../services/traceability');
// const ContractHistory = require('../models/ContractHistory');
const auth = require('../middleware/auth');
const emailService = require('../services/emailService');

// Removed unused filesRouter import
// Ensure associations are registered (Contract <-> User via ContractViewer)
require('../models/associations');
const { upload, uploadContractWithGoogleDrive } = require('../middleware/upload');
const { validateContractAction, getNextStatus } = require('../middleware/contractAuth');
const googleDriveService = require('../services/googleDrive');
const fs = require('fs');

// Función helper para combinar contratos con otrosí y eliminar duplicados
const combineContractsWithOtrosi = (contracts, contractsWithOtrosi) => {
  const contractMap = new Map();
  
  contracts.forEach(contract => {
    contractMap.set(contract.id, contract);
  });
  
  contractsWithOtrosi.forEach(contract => {
    if (contractMap.has(contract.id)) {
      const existingContract = contractMap.get(contract.id);
      if (contract.otrosi && contract.otrosi.length > 0) {
        existingContract.otrosi = contract.otrosi;
      }
    } else {
      contractMap.set(contract.id, contract);
    }
  });
  
  return Array.from(contractMap.values()).sort((a, b) => b.id - a.id);
};

// Optimized contract includes - Load otrosi data efficiently to prevent N+1 queries
const contractIncludeOptions = [
  {
    model: User,
    as: 'solicitante',
    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
  },
  {
    model: User,
    as: 'viewers',
    attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
    through: { attributes: [] }
  },
  {
    model: ContractFile,
    as: 'files',
    attributes: ['id', 'filename', 'filepath', 'category', 'fileType', 'responseType', 'contractId', 'created_at', 'updated_at']
  },
  {
    model: require('../models/Otrosi'),
    as: 'otrosi',
    // Only load essential fields for performance - detailed data loaded on-demand
    attributes: ['id', 'contractId', 'numeroOtrosi', 'estado', 'fechaCreacion'],
    required: false // LEFT JOIN to include contracts without otrosi
  }
];

// Lightweight includes for list views (better performance)
const contractListIncludeOptions = [
  {
    model: User,
    as: 'solicitante',
    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
  },
  {
    model: require('../models/Otrosi'),
    as: 'otrosi',
    // Minimal data for card display
    attributes: ['id', 'contractId'],
    required: false
  }
];

// GET /api/contracts - Contratos del usuario logueado
router.get('/', auth, async (req, res) => {
  try {
    let whereClause;
    
    // Estados permitidos para contratos enviados
    const allowedStates = ['new', 'awaiting_lawyer_review', 'signature_otrosi_already_signedByUser', 'otrosi_awaiting_lawyer_review'];
    
    if (req.user.role === 'lawyer') {
      // Los abogados pueden ver todos los contratos con los estados especificados
      whereClause = { estado: allowedStates };
    } else {
      // Los usuarios regulares solo pueden ver sus propios contratos con los estados especificados
      whereClause = { 
        solicitanteId: req.user.id,
        estado: allowedStates
      };
    }
    
    // Use lightweight includes for list view - better performance
    const contracts = await Contract.findAll({
      where: whereClause,
      include: contractListIncludeOptions,
      order: [['id', 'DESC']],
    });
    
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/traceability - Listado para mini-cards de trazabilidad
router.get('/traceability', auth, async (req, res) => {
  try {
    // Abogado: todos los contratos; Usuario regular: solo los propios
    const whereClause = req.user.role === 'lawyer' ? {} : { solicitanteId: req.user.id };
    
    const contracts = await Contract.findAll({
      where: whereClause,
      attributes: ['id', 'descripcion', 'estado', 'solicitanteId', 'proveedor', 'tipoContrato', 'fechaIngreso'],
      include: [
        {
          model: User,
          as: 'solicitante',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['id', 'DESC']]
    });

    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/:id/history - Trazabilidad completa del contrato
router.get('/:id/history', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findByPk(id);
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    // Usuarios regulares solo pueden ver sus contratos
    if (req.user.role !== 'lawyer' && contract.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contracts - Crear nuevo contrato
router.post('/', auth, uploadContractWithGoogleDrive, async (req, res) => {
  try {
    // Solo usuarios regulares pueden crear contratos
    if (req.user.role !== 'regular') {
      return res.status(403).json({ error: 'Solo los usuarios regulares pueden crear contratos' });
    }
    
    // Extraer datos del contrato
    const {
      tipoSolicitud,
      tipoContrato,
      descripcion,
      area,
      gerenteArea,
      proveedor,
      nitProveedor,
      valorSinIVA,
      moneda,
      fechaInicio,
      fechaFinal,
      formaPago
    } = req.body;
    
    // Validar campos requeridos
    if (!tipoSolicitud || !tipoContrato || !descripcion || !area || !gerenteArea || !proveedor || !nitProveedor || !valorSinIVA || !moneda || !fechaInicio || !fechaFinal || !formaPago) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }
    
    // Validar archivos requeridos - solo oferta es obligatorio
    if (!req.googleDriveFiles || req.googleDriveFiles.length === 0) {
      return res.status(400).json({ error: 'Debe subir al menos un archivo' });
    }
    
    // Verificar que hay archivo de oferta (obligatorio)
    const hasOfertaFile = req.googleDriveFiles.some(file => file.category === 'oferta');
    
    if (!hasOfertaFile) {
      return res.status(400).json({ error: 'Debe subir al menos un archivo de oferta' });
    }
    
    // Calcular duración en días
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFinal);
    const duracion = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Calcular IVA (asumiendo 19% por defecto)
    const valorSinIVANum = parseFloat(valorSinIVA);
    const porcentajeIVA = 19;
    const valorIVA = (valorSinIVANum * porcentajeIVA) / 100;
    const valorTotal = valorSinIVANum + valorIVA;
    
    // Crear el contrato
    const contract = await Contract.create({
      tipoSolicitud,
      tipoContrato,
      descripcion,
      area,
      gerenteArea,
      proveedor,
      nitProveedor,
      valorSinIVA: valorSinIVANum,
      valorIVA,
      moneda,
      fechaInicio: startDate,
      fechaFinal: endDate,
      duracion,
      estado: 'new',
      nombreSolicitante: `${req.user.firstName} ${req.user.lastName}`,
      formaPago,
      fechaIngreso: new Date(),
      solicitanteId: req.user.id
    });
    
    // Procesar archivos subidos a Google Drive por el middleware

    if (req.googleDriveFiles && req.googleDriveFiles.length > 0) {

      // Create database records for files already uploaded to Google Drive
      for (const fileData of req.googleDriveFiles) {
        try {
          // Determine file category based on filename content
          let fileCategory = 'contrato';
          let fileType = 'Contrato';

          const filename = fileData.originalName.toLowerCase();
          if (filename.includes('oferta') || filename.includes('offer')) {
            fileCategory = 'oferta';
            fileType = 'Oferta';
          } else if (filename.includes('camara') || filename.includes('chamber') || filename.includes('comercio')) {
            fileCategory = 'camara';
            fileType = 'Cámara';
          } else if (filename.includes('otros') || filename.includes('other') || filename.includes('adicional')) {
            fileCategory = 'otros';
            fileType = 'Otros';
          }

          console.log(`📤 Creating database record for Google Drive file:`, {
            originalName: fileData.originalName,
            googleDriveId: fileData.googleDriveFileId,
            contractId: contract.id,
            category: fileCategory,
            fileType: fileType
          });

          // Create database record with Google Drive file ID (file already uploaded)
          await ContractFile.create({
            filename: fileData.originalName,
            filepath: fileData.googleDriveFileId, // Store Google Drive file ID
            mimetype: 'application/pdf',
            size: fileData.size,
            category: fileCategory,
            fileType,
            responseType: 'regular',
            contractId: contract.id
          });

          console.log('✅ Archivo de contrato guardado con Google Drive ID:', {
            filename: fileData.originalName,
            fileId: fileData.googleDriveFileId,
            category: fileCategory,
            contractId: contract.id,
            dbRecordCreated: true
          });

        } catch (uploadError) {
          console.error(`❌ Error creating database record for Google Drive file:`, {
            filename: fileData.originalName,
            googleDriveId: fileData.googleDriveFileId,
            error: uploadError.message,
            stack: uploadError.stack
          });

          // Continue with other files, but log the error
          console.error(`❌ Failed to create record for ${fileData.originalName}: ${uploadError.message}`);
        }
      }
      console.log('✅ Finished processing all contract files');
    } else {
      console.log('ℹ️  No files to process for this contract');
    }
    
    // Crear historial del contrato
    await recordHistory({
      contractId: contract.id,
      userId: req.user.id,
      role: req.user.role,
      action: 'created',
      oldStatus: null,
      newStatus: 'new',
      comment: 'El contrato fue creado y enviado para revisión',
    });
    
    // Enviar notificaciones por email - PATRÓN ESTÁNDAR
    try {
      // Obtener datos del contrato con solicitante
      const contractWithSolicitante = await Contract.findByPk(contract.id, {
        include: [{ model: User, as: 'solicitante', attributes: ['email'] }]
      });

      const solicitanteEmail = contractWithSolicitante.solicitante?.email;

      // 1. DISABLED: Solo se envían notificaciones cuando se requiere acción
      // if (solicitanteEmail) {
      //   await emailService.sendContractCreatedNotification(
      //     solicitanteEmail,
      //     {
      //       id: contract.id,
      //       descripcion: contract.descripcion,
      //       proveedor: contract.proveedor,
      //       valorTotal: contract.valorTotal,
      //       moneda: contract.moneda
      //     }
      //   );
      // }
      
      // 2. Enviar "Nuevo Contrato Enviado para Revisión" a los abogados
      const lawyers = await User.findAll({
        where: { role: 'lawyer', status: 'approved' },
        attributes: ['email']
      });
      const lawyerEmails = lawyers.map(lawyer => lawyer.email);
      
      if (lawyerEmails.length > 0) {
        await emailService.sendContractSentToLawyerNotification(
          lawyerEmails,
          {
            id: contract.id,
            descripcion: contract.descripcion,
            proveedor: contract.proveedor,
            valorTotal: contract.valorTotal,
            moneda: contract.moneda
          }
        );
      }

      // 3. Enviar "Acción Requerida" SOLO a quien debe responder (abogados)
      if (lawyerEmails.length > 0) {
        await emailService.sendContractActionRequiredNotification(
          lawyerEmails, 
          {
            id: contract.id,
            descripcion: contract.descripcion,
            proveedor: contract.proveedor,
            valorTotal: contract.valorTotal,
            moneda: contract.moneda
          }, 
          'review', 
          'lawyer'
        );
      }

    } catch (emailError) {
      console.error('❌ Error enviando emails:', emailError);
      // No fallar la operación por error de email
    }
    
    // Obtener el contrato completo con archivos
    const contractWithFiles = await Contract.findByPk(contract.id, {
      include: contractIncludeOptions
    });
    
    res.status(201).json(contractWithFiles);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/all
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Solo los abogados pueden acceder a esta información' });
    }
    
    const contracts = await Contract.findAll({
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/new
router.get('/new', auth, async (req, res) => {
  try {
    
    if (req.user.role !== 'lawyer') {
      console.log('❌ Usuario no es abogado, acceso denegado');
      return res.status(403).json({ error: 'Solo los abogados pueden acceder a esta información' });
    }
    
    
    const contracts = await Contract.findAll({
      where: { estado: 'new' },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });
    
    
    res.json(contracts);
  } catch (error) {
    console.error('❌ Error en endpoint /new:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/returned
router.get('/returned', auth, async (req, res) => {
  try {
    
    // First, let's see all contract states in the database
    const allContracts = await Contract.findAll({
      attributes: ['id', 'estado', 'nombreSolicitante'],
      order: [['id', 'DESC']],
      limit: 20
    });
    
    // Contratos devueltos incluye tanto 'awaiting_lawyer_review' como 'otrosi_awaiting_lawyer_review'
    const contracts = await Contract.findAll({
      where: { 
        estado: ['awaiting_lawyer_review', 'otrosi_awaiting_lawyer_review'] 
      },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });
    
    
    res.json(contracts);
  } catch (error) {
    console.error('❌ Error en /returned:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/awaiting-user-response
router.get('/awaiting-user-response', auth, async (req, res) => {
  try {
    const Otrosi = require('../models/Otrosi');

    let contracts = [];
    let contractsWithOtrosiAwaitingUserResponse = [];

    if (req.user.role === 'lawyer') {
      // Abogado: ver todos los contratos esperando respuesta del usuario (incluye otrosí)
      contracts = await Contract.findAll({
      where: { estado: 'awaiting_user_response' },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });

    try {
        contractsWithOtrosiAwaitingUserResponse = await Contract.findAll({
        include: [
          {
            model: Otrosi,
            as: 'otrosi',
            where: { estado: 'otrosi_awaiting_user_response' },
            required: true
          }
        ],
        order: [['id', 'DESC']],
      });
    } catch (otrosiError) {
        contractsWithOtrosiAwaitingUserResponse = [];
      }
    } else {
      // Usuario regular: ver solo sus contratos en esperando respuesta (incluye otrosí)
      contracts = await Contract.findAll({
        where: { 
          estado: 'awaiting_user_response',
          solicitanteId: req.user.id
        },
        include: contractIncludeOptions,
        order: [['id', 'DESC']],
      });

      try {
        contractsWithOtrosiAwaitingUserResponse = await Contract.findAll({
          where: { solicitanteId: req.user.id },
          include: [
            {
              model: Otrosi,
              as: 'otrosi',
              where: { estado: 'otrosi_awaiting_user_response' },
              required: true
            }
          ],
          order: [['id', 'DESC']],
        });
      } catch (otrosiError) {
        contractsWithOtrosiAwaitingUserResponse = [];
      }
    }

    const allContracts = combineContractsWithOtrosi(contracts, contractsWithOtrosiAwaitingUserResponse);
    res.json(allContracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/managed
router.get('/managed', auth, async (req, res) => {
  try {
    let contracts;
    
    if (req.user.role === 'regular') {
      // Usuarios regulares ven contratos en awaiting_user_response
      contracts = await Contract.findAll({
        where: {
          estado: 'awaiting_user_response',
          solicitanteId: req.user.id
        },
        attributes: ['id', 'estado', 'solicitanteId', 'descripcion']
      });
    } else if (req.user.role === 'lawyer') {
      // Abogados ven contratos en awaiting_lawyer_review
      contracts = await Contract.findAll({
        where: { estado: 'awaiting_lawyer_review' },
        attributes: ['id', 'estado', 'solicitanteId', 'descripcion']
      });
    } else {
      return res.status(403).json({ error: 'Rol no válido' });
    }
    
    res.json({ message: 'Contratos obtenidos exitosamente', contracts: contracts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/lawyer-awaiting-response
router.get('/lawyer-awaiting-response', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Solo los abogados pueden acceder a esta información' });
    }
    
    const contracts = await Contract.findAll({
      where: { estado: 'awaiting_lawyer_review' },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });

    const contractsOtrosiSignedByUser = await Contract.findAll({
      where: { estado: 'signature_otrosi_already_signedByUser' },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });

    let contractsWithOtrosiAwaitingSignature = [];
    try {
      const Otrosi = require('../models/Otrosi');
      contractsWithOtrosiAwaitingSignature = await Contract.findAll({
        include: [
          { model: Otrosi, as: 'otrosi', where: { estado: 'otrosi_awaiting_signature' }, required: true }
        ],
        order: [['id', 'DESC']],
      });
    } catch (otrosiError) {
      contractsWithOtrosiAwaitingSignature = [];
    }

    let contractsWithOtrosiAwaitingLawyerReview = [];
    try {
      const Otrosi = require('../models/Otrosi');
      
      // First, let's see what otrosi records actually exist
      const allOtrosi = await Otrosi.findAll({
        attributes: ['id', 'contractId', 'estado', 'numeroOtrosi'],
        order: [['id', 'DESC']],
        limit: 10
      });
      
      // Now check specifically for contracts in otrosi_awaiting_lawyer_review state
      const contractsInOtrosiState = await Contract.findAll({
        where: { estado: 'otrosi_awaiting_lawyer_review' },
        attributes: ['id', 'estado', 'nombreSolicitante']
      });
      
      const otrosiCount = await Otrosi.count({ where: { estado: 'otrosi_awaiting_lawyer_review' } });
      
      if (otrosiCount > 0) {
        const otrosiDetails = await Otrosi.findAll({
          where: { estado: 'otrosi_awaiting_lawyer_review' },
          attributes: ['id', 'contractId', 'estado', 'numeroOtrosi']
        });
        const contractIds = otrosiDetails.map(o => o.contractId);
        
        contractsWithOtrosiAwaitingLawyerReview = await Contract.findAll({
          where: { id: contractIds },
          include: contractIncludeOptions,
          order: [['id', 'DESC']],
        });
      }
    } catch (otrosiError) {
      console.error('❌ Error buscando otrosi awaiting lawyer review:', otrosiError);
      contractsWithOtrosiAwaitingLawyerReview = [];
    }

    // Combinar todos los contratos eliminando duplicados
    const baseContracts = [...contracts, ...contractsOtrosiSignedByUser];
    const otrosiContracts = [...contractsWithOtrosiAwaitingSignature, ...contractsWithOtrosiAwaitingLawyerReview];
    
    const allContracts = combineContractsWithOtrosi(baseContracts, otrosiContracts);
    
    res.json(allContracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/awaiting-signature (role-aware: regular vs lawyer)
router.get('/awaiting-signature', auth, async (req, res) => {
  try {
    const Otrosi = require('../models/Otrosi');

    let contracts = [];
    let contractsWithOtrosiAwaitingSignature = [];

    if (req.user.role === 'lawyer') {
      // Abogado: ver todos los contratos en awaiting_signature + otrosi_awaiting_signature
      contracts = await Contract.findAll({
        where: { estado: 'awaiting_signature' },
        include: contractIncludeOptions,
        order: [['id', 'DESC']],
      });

      try {
        contractsWithOtrosiAwaitingSignature = await Contract.findAll({
          include: [
            ...contractIncludeOptions.filter(opt => opt.model !== require('../models/Otrosi')),
            {
              model: Otrosi,
              as: 'otrosi',
              where: { estado: 'otrosi_awaiting_signature' },
              required: true
            }
          ],
          order: [['id', 'DESC']],
        });
      } catch (otrosiError) {
        contractsWithOtrosiAwaitingSignature = [];
      }
    } else {
      // Usuario regular: ver solo los propios contratos en awaiting_signature + otrosi_awaiting_signature
      contracts = await Contract.findAll({
      where: { 
          estado: 'awaiting_signature',
          solicitanteId: req.user.id
      },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });

    try {
        contractsWithOtrosiAwaitingSignature = await Contract.findAll({
          where: { solicitanteId: req.user.id },
        include: [
          ...contractIncludeOptions.filter(opt => opt.model !== require('../models/Otrosi')),
          {
            model: Otrosi,
            as: 'otrosi',
              where: { estado: 'otrosi_awaiting_signature' },
            required: true
          }
        ],
        order: [['id', 'DESC']],
      });
    } catch (otrosiError) {
        contractsWithOtrosiAwaitingSignature = [];
      }
    }

    const allContracts = combineContractsWithOtrosi(contracts, contractsWithOtrosiAwaitingSignature);
    res.json(allContracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/lawyer-awaiting-signature
router.get('/lawyer-awaiting-signature', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Solo los abogados pueden acceder a esta información' });
    }
    
    const Otrosi = require('../models/Otrosi');

    // Contratos en awaiting_signature
    const contracts = await Contract.findAll({
      where: { estado: 'awaiting_signature' },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });

    // Contratos con otrosí en otrosi_awaiting_signature
    let contractsWithOtrosiAwaitingSignature = [];
    try {
      contractsWithOtrosiAwaitingSignature = await Contract.findAll({
        include: [
          ...contractIncludeOptions.filter(opt => opt.model !== require('../models/Otrosi')),
          {
            model: Otrosi,
            as: 'otrosi',
            where: { estado: 'otrosi_awaiting_signature' },
            required: true
          }
        ],
        order: [['id', 'DESC']],
      });
    } catch (otrosiError) {
      contractsWithOtrosiAwaitingSignature = [];
    }

    const allContracts = combineContractsWithOtrosi(contracts, contractsWithOtrosiAwaitingSignature);
    res.json(allContracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/finalizado
router.get('/finalizado', auth, async (req, res) => {
  try {
    let whereClause;
    
    if (req.user.role === 'lawyer') {
      whereClause = { estado: 'signed' };
    } else {
      whereClause = { 
        estado: 'signed',
        solicitanteId: req.user.id
      };
    }
    
    const contracts = await Contract.findAll({
      where: whereClause,
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });

    let contractsWithOtrosiSigned = [];
    try {
      const Otrosi = require('../models/Otrosi');
      const includeOptionsForOtrosiSigned = [
          ...contractIncludeOptions.filter(opt => opt.model !== require('../models/Otrosi')),
          {
            model: Otrosi,
            as: 'otrosi',
            where: { estado: 'otrosi_signed' },
            required: true
          }
      ];
      
      contractsWithOtrosiSigned = await Contract.findAll({
        where: { estado: 'signed' },
        include: includeOptionsForOtrosiSigned,
      order: [['id', 'DESC']],
    });
    } catch (otrosiError) {
      contractsWithOtrosiSigned = [];
    }

    const allContracts = combineContractsWithOtrosi(contracts, contractsWithOtrosiSigned);
    res.json(allContracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/lawyer-finalized
router.get('/lawyer-finalized', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Solo los abogados pueden acceder a esta información' });
    }
    
    // Buscar contratos normales finalizados
    const contracts = await Contract.findAll({
      where: { estado: 'signed' },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });

    // Buscar contratos con otrosí finalizados
    let contractsWithOtrosiSigned = [];
    try {
      const Otrosi = require('../models/Otrosi');
      const includeOptionsForOtrosiSigned = [
          ...contractIncludeOptions.filter(opt => opt.model !== require('../models/Otrosi')),
          {
            model: Otrosi,
            as: 'otrosi',
            where: { estado: 'otrosi_signed' },
            required: true
          }
      ];
      
      contractsWithOtrosiSigned = await Contract.findAll({
        where: { estado: 'signed' },
        include: includeOptionsForOtrosiSigned,
        order: [['id', 'DESC']],
      });
    } catch (otrosiError) {
      contractsWithOtrosiSigned = [];
    }

    const allContracts = combineContractsWithOtrosi(contracts, contractsWithOtrosiSigned);
    res.json(allContracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/:id
router.get('/:id', auth, async (req, res) => {
  try {
    
    const contract = await Contract.findByPk(req.params.id, {
      include: contractIncludeOptions
    });
    
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }
    
    
    // If a lawyer opens the contract, record as viewer (first time)
    try {
      if (req.user.role === 'lawyer') {
        const [link, created] = await ContractViewer.findOrCreate({
          where: { contractId: contract.id, userId: req.user.id },
          defaults: { contractId: contract.id, userId: req.user.id }
        });
        if (created) {
          // Reload viewers to reflect in response
          await contract.reload({ include: contractIncludeOptions });
        }
      }
    } catch (viewerErr) {
      // Non-blocking
      console.warn('Viewer tracking warning:', viewerErr.message);
    }

    console.log('📤 Sending contract response with files:', {
      contractId: contract.id,
      filesInResponse: contract.files ? contract.files.length : 0
    });
    
    res.json(contract);
  } catch (error) {
    console.error('❌ Error in GET /api/contracts/:id:', error);
    res.status(500).json({ error: error.message });
  }
});

// Middleware for contract response file uploads to Google Drive
const uploadContractResponseFiles = async (req, res, next) => {
  upload.array('files', 10)(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return next();
    }

    try {
      const uploadedFiles = [];
      const contractId = req.params.id;
      
      for (const file of req.files) {
        try {
          const fileCategory = req.user.role === 'lawyer' ? 'respuesta_abogado' : 'respuesta_usuario';
          
          console.log(`Uploading contract response file to Google Drive from memory buffer:`, {
            originalName: file.originalname,
            bufferSize: file.buffer.length,
            contractId,
            category: fileCategory
          });

          const googleDriveResult = await googleDriveService.uploadContractFileFromBuffer(
            file.buffer,
            contractId,
            file.originalname,
            fileCategory
          );

          uploadedFiles.push({
            originalFile: file,
            googleDriveFileId: googleDriveResult.id,
            googleDriveFileName: googleDriveResult.name,
            originalName: googleDriveResult.originalName,
            size: googleDriveResult.size,
            webViewLink: googleDriveResult.webViewLink,
            category: fileCategory
          });

          console.log(`Successfully uploaded contract response file to Google Drive:`, {
            fileId: googleDriveResult.id,
            fileName: googleDriveResult.name
          });

        } catch (uploadError) {
          console.error(`Error uploading contract response file to Google Drive:`, uploadError);
          
          // No temporary files to clean up - using memory storage! 🎉

          return res.status(500).json({ 
            error: `Failed to upload file to Google Drive: ${uploadError.message}` 
          });
        }
      }

      // No temporary files to clean up - using memory storage! 🎉

      req.googleDriveFiles = uploadedFiles;
      next();
    } catch (error) {
      console.error('Error in contract response Google Drive upload middleware:', error);
      
      // No temporary files to clean up - using memory storage! 🎉

      return res.status(500).json({ 
        error: 'Internal server error during file upload' 
      });
    }
  });
};

// POST /api/contracts/:id/respond
router.post('/:id/respond', auth, uploadContractResponseFiles, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const { comment } = req.body;
    const isOtrosiState = contract.estado.includes('otrosi') || contract.estado === 'signature_otrosi_already_signedByUser';
    
    let currentOtrosi = null;
    if (isOtrosiState) {
        const Otrosi = require('../models/Otrosi');
      currentOtrosi = await Otrosi.findOne({
        where: { contractId: contract.id },
        order: [['id', 'DESC']]
      });
      
      if (!currentOtrosi) {
        currentOtrosi = await Otrosi.create({
          contractId: contract.id,
          numeroOtrosi: 1,
          descripcionCambios: 'Otrosí creado automáticamente',
          valorTotal: contract.valorTotal,
          moneda: contract.moneda,
          porcentajeIVA: 19,
          valorIVA: contract.valorIVA,
          formaPago: 'Otrosí',
          fechaInicio: new Date(),
          fechaFinal: new Date(),
          estado: 'pendiente',
          firmadoPorUsuario: false
          });
        }
      }

    let finalContractStatus;
    let finalOtrosiStatus;
    let fileStorageModel;

    if (isOtrosiState) {
      // Special-case: if the current flow is otrosí and the user is regular responding to a
      // contract in otrosi_awaiting_signature, the contrato should be finalized and the otrosí marked as signed
      if (req.user.role === 'regular' && contract.estado === 'otrosi_awaiting_signature') {
        finalContractStatus = 'signed';
        finalOtrosiStatus = 'otrosi_signed';
      } else if (req.user.role === 'regular') {
        finalContractStatus = 'otrosi_awaiting_lawyer_review';
        finalOtrosiStatus = 'otrosi_awaiting_lawyer_review';
      } else {
        finalContractStatus = 'otrosi_awaiting_signature';
        finalOtrosiStatus = 'otrosi_awaiting_signature';
      }
      fileStorageModel = require('../models/OtrosiFile');
    } else {
      // Determine next status for non-otrosí contracts using centralized rules
      const next = getNextStatus(contract.estado, req.user.role, 'respond');
      if (!next) {
        return res.status(400).json({ error: `Transición de estado no válida desde ${contract.estado} para rol ${req.user.role} con acción respond` });
      }
      finalContractStatus = next;
      fileStorageModel = ContractFile;
    }

    const oldStatusRespond = contract.estado;

    await contract.update({ estado: finalContractStatus });

    if (isOtrosiState && currentOtrosi) {
      await currentOtrosi.update({ estado: finalOtrosiStatus });
    }

    if (req.googleDriveFiles && req.googleDriveFiles.length > 0) {
        for (const fileData of req.googleDriveFiles) {
        const category = req.user.role === 'regular' ? 'Respuesta Usuario' : 'Respuesta Abogado';
        const fileType = req.user.role === 'regular' ? 'Respuesta Usuario' : 'Respuesta Abogado';
        const responseType = req.user.role === 'regular' ? 'regular' : 'lawyer';

        const createData = {
              filename: fileData.originalName,
          filepath: fileData.googleDriveFileId, // Store Google Drive file ID
          mimetype: 'application/pdf',
          size: fileData.size,
          category,
          fileType,
          responseType,
          contractId: contract.id
        };

        // If saving into OtrosiFile, provide required otrosiId and metadata
        if (isOtrosiState && currentOtrosi) {
          createData.otrosiId = currentOtrosi.id;
          createData.uploadedBy = req.user.id;
          createData.uploadedAt = new Date();
        }

        await fileStorageModel.create(createData);
        console.log('📄 Archivo de respuesta guardado con Google Drive ID:', {
          filename: fileData.originalName,
          fileId: fileData.googleDriveFileId,
          category
        });
      }
    }

    // Registrar historial (centralizado)
    await recordHistory({
        contractId: contract.id,
        userId: req.user.id,
        role: req.user.role,
      action: 'respond',
      oldStatus: oldStatusRespond,
      newStatus: finalContractStatus,
      comment: comment || 'Respuesta enviada',
    });

    // Enviar notificaciones por email - PATRÓN ESTÁNDAR
    try {
      // Obtener datos del contrato con solicitante
      const contractWithSolicitante = await Contract.findByPk(contract.id, {
        include: [{ model: User, as: 'solicitante', attributes: ['email'] }]
      });

      const solicitanteEmail = contractWithSolicitante.solicitante?.email;

      // 1. Enviar "Estado del Contrato Actualizado" a TODOS (solicitante + abogados)
      const allEmails = [];
      
      // Agregar email del solicitante
      if (solicitanteEmail) {
        allEmails.push(solicitanteEmail);
      }
      
      // Agregar emails de abogados
      const lawyers = await User.findAll({
        where: { role: 'lawyer', status: 'approved' },
        attributes: ['email']
      });
      const lawyerEmails = lawyers.map(lawyer => lawyer.email);
      allEmails.push(...lawyerEmails);
      
      // DISABLED: Solo se envían notificaciones cuando se requiere acción
      // if (allEmails.length > 0) {
      //   await emailService.sendContractStatusChangeNotification(
      //     allEmails,
      //     {
      //       id: contract.id,
      //       descripcion: contract.descripcion,
      //       proveedor: contract.proveedor,
      //       valorTotal: contract.valorTotal,
      //       moneda: contract.moneda
      //     },
      //     oldStatusRespond,
      //     finalContractStatus
      //   );
      // }

      // 2. Enviar "Acción Requerida" SOLO a quien debe responder
      if (finalContractStatus === 'awaiting_user_response' || finalContractStatus === 'otrosi_awaiting_user_response') {
        // Notificar al usuario solicitante
        if (solicitanteEmail) {
          await emailService.sendContractActionRequiredNotification(
            solicitanteEmail,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            'respond',
            'regular'
          );
        }
      } else if (finalContractStatus === 'awaiting_lawyer_review' || finalContractStatus === 'otrosi_awaiting_lawyer_review') {
        // Notificar a los abogados
        if (lawyerEmails.length > 0) {
          await emailService.sendContractActionRequiredNotification(
            lawyerEmails,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            'review',
            'lawyer'
          );
        }
      } else if (finalContractStatus === 'awaiting_signature' || finalContractStatus === 'otrosi_awaiting_signature') {
        // Notificar para firma
        if (solicitanteEmail) {
          await emailService.sendContractActionRequiredNotification(
            solicitanteEmail,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            'sign',
            'regular'
          );
        }
      }

    } catch (emailError) {
      console.error('❌ Error enviando emails:', emailError);
      // No fallar la operación por error de email
    }

    res.json({ message: 'Respuesta enviada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// POST /api/contracts/:id/sign
router.post('/:id/sign', auth, uploadContractResponseFiles, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const { comment } = req.body;
    const isOtrosiState = contract.estado.includes('otrosi') || contract.estado === 'signature_otrosi_already_signedByUser';
    
    let currentOtrosi = null;
    if (isOtrosiState) {
        const Otrosi = require('../models/Otrosi');
      currentOtrosi = await Otrosi.findOne({
        where: { contractId: contract.id },
        order: [['id', 'DESC']]
      });
    }

    let finalContractStatus;
    let finalOtrosiStatus;
    let fileStorageModel;

    if (isOtrosiState) {
      // Handle otrosi state transitions based on current contract state and user role
      if (req.user.role === 'lawyer' && contract.estado === 'signature_otrosi_already_signedByUser') {
        // Usuario ya firmó, abogado firma ahora -> completado
        finalContractStatus = 'signed';
        finalOtrosiStatus = 'otrosi_signed';
      } else if (req.user.role === 'lawyer' && contract.estado === 'otrosi_awaiting_lawyer_review') {
        // Abogado aprueba/firma otrosi -> va a espera de firma
        finalContractStatus = 'otrosi_awaiting_signature';
        finalOtrosiStatus = 'otrosi_awaiting_signature';
      } else if (req.user.role === 'regular' && contract.estado === 'otrosi_awaiting_signature') {
        // Usuario firma en estado de espera de firma -> completado  
        finalContractStatus = 'signed';
        finalOtrosiStatus = 'otrosi_signed';
      } else if (req.user.role === 'lawyer' && contract.estado === 'otrosi_awaiting_signature') {
        // Abogado firma en estado de espera de firma -> completado
        finalContractStatus = 'signed';
        finalOtrosiStatus = 'otrosi_signed';
      } else {
        // Otros casos no deberían llegar aquí, usar el middleware de acción
        return res.status(400).json({ error: 'Estado no válido para firma directa. Use el endpoint de acción.' });
      }
      fileStorageModel = require('../models/OtrosiFile');
    } else {
      // Use centralized logic for non-otrosí contracts
      const next = getNextStatus(contract.estado, req.user.role, 'sign');
      if (!next) {
        return res.status(400).json({ error: `Transición de estado no válida desde ${contract.estado} para rol ${req.user.role} con acción sign` });
      }
      finalContractStatus = next;
      fileStorageModel = ContractFile;
    }

    const oldStatusSign = contract.estado;
    await contract.update({ estado: finalContractStatus });

    if (isOtrosiState && currentOtrosi) {
      await currentOtrosi.update({ estado: finalOtrosiStatus });
    }

    if (req.googleDriveFiles && req.googleDriveFiles.length > 0) {
      for (const fileData of req.googleDriveFiles) {
        const category = req.user.role === 'regular' ? 'Firma Usuario' : 'Firma Abogado';
        const fileType = req.user.role === 'regular' ? 'Firma Usuario' : 'Firma Abogado';
        const responseType = req.user.role === 'regular' ? 'regular' : 'lawyer';

        const createData = {
          filename: fileData.originalName,
          filepath: fileData.googleDriveFileId, // Store Google Drive file ID
          mimetype: 'application/pdf',
          size: fileData.size,
          category,
          fileType,
          responseType,
          contractId: contract.id
        };

        if (isOtrosiState && currentOtrosi) {
          createData.otrosiId = currentOtrosi.id;
          createData.uploadedBy = req.user.id;
          createData.uploadedAt = new Date();
        }

        await fileStorageModel.create(createData);
        console.log('✍️  Firma guardada con Google Drive ID:', fileData.googleDriveFileId);
      }
    }

    await recordHistory({
      contractId: contract.id,
      userId: req.user.id,
      role: req.user.role,
      action: 'sign',
      oldStatus: oldStatusSign,
      newStatus: finalContractStatus,
      comment: comment || 'Firma enviada',
    });

    // Enviar notificaciones por email - PATRÓN ESTÁNDAR
    try {
      // Obtener datos del contrato con solicitante
      const contractWithSolicitante = await Contract.findByPk(contract.id, {
        include: [{ model: User, as: 'solicitante', attributes: ['email'] }]
      });

      const solicitanteEmail = contractWithSolicitante.solicitante?.email;

      // 1. Enviar "Estado del Contrato Actualizado" a TODOS (solicitante + abogados)
      const allEmails = [];
      
      // Agregar email del solicitante
      if (solicitanteEmail) {
        allEmails.push(solicitanteEmail);
      }
      
      // Agregar emails de abogados
      const lawyers = await User.findAll({
        where: { role: 'lawyer', status: 'approved' },
        attributes: ['email']
      });
      const lawyerEmails = lawyers.map(lawyer => lawyer.email);
      allEmails.push(...lawyerEmails);
      
      // DISABLED: Solo se envían notificaciones cuando se requiere acción
      // if (allEmails.length > 0) {
      //   await emailService.sendContractStatusChangeNotification(
      //     allEmails,
      //     {
      //       id: contract.id,
      //       descripcion: contract.descripcion,
      //       proveedor: contract.proveedor,
      //       valorTotal: contract.valorTotal,
      //       moneda: contract.moneda
      //     },
      //     oldStatusSign,
      //     finalContractStatus
      //   );
      // }

      // 2. Enviar "Acción Requerida" SOLO a quien debe responder (si aplica)
      if (finalContractStatus === 'awaiting_user_response' || finalContractStatus === 'otrosi_awaiting_user_response') {
        // Notificar al usuario solicitante
        if (solicitanteEmail) {
          await emailService.sendContractActionRequiredNotification(
            solicitanteEmail,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            'respond',
            'regular'
          );
        }
      } else if (finalContractStatus === 'awaiting_lawyer_review' || finalContractStatus === 'otrosi_awaiting_lawyer_review') {
        // Notificar a los abogados
        if (lawyerEmails.length > 0) {
          await emailService.sendContractActionRequiredNotification(
            lawyerEmails,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            'review',
            'lawyer'
          );
        }
      } else if (finalContractStatus === 'awaiting_signature' || finalContractStatus === 'otrosi_awaiting_signature') {
        // Notificar para firma
        if (solicitanteEmail) {
          await emailService.sendContractActionRequiredNotification(
            solicitanteEmail,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            'sign',
            'regular'
          );
        }
      }

    } catch (emailError) {
      console.error('❌ Error enviando emails:', emailError);
      // No fallar la operación por error de email
    }

    res.json({ message: 'Firma enviada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contracts/:id/return
router.post('/:id/return', auth, uploadContractResponseFiles, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    const { comment } = req.body;
    const isOtrosiState = contract.estado.includes('otrosi') || contract.estado === 'signature_otrosi_already_signedByUser';
    
    let currentOtrosi = null;
    if (isOtrosiState) {
    const Otrosi = require('../models/Otrosi');
      currentOtrosi = await Otrosi.findOne({
        where: { contractId: contract.id },
        order: [['id', 'DESC']]
      });
    }

    let finalContractStatus;
    let finalOtrosiStatus;
    let fileStorageModel;

    if (isOtrosiState) {
      if (req.user.role === 'regular') {
        finalContractStatus = 'otrosi_awaiting_lawyer_review';
        finalOtrosiStatus = 'otrosi_awaiting_lawyer_review';
      } else {
        finalContractStatus = 'otrosi_awaiting_user_response';
        finalOtrosiStatus = 'otrosi_awaiting_user_response';
      }
      fileStorageModel = require('../models/OtrosiFile');
    } else {
      if (req.user.role === 'regular') {
        finalContractStatus = 'awaiting_lawyer_review';
      } else {
        finalContractStatus = 'awaiting_user_response';
      }
      fileStorageModel = ContractFile;
    }

    const oldStatusReturn = contract.estado;
    await contract.update({ estado: finalContractStatus });

    if (isOtrosiState && currentOtrosi) {
      await currentOtrosi.update({ estado: finalOtrosiStatus });
    }

    if (req.googleDriveFiles && req.googleDriveFiles.length > 0) {
      for (const file of req.googleDriveFiles) {
        const category = req.user.role === 'regular' ? 'Respuesta Usuario' : 'Respuesta Abogado';
        const fileType = req.user.role === 'regular' ? 'Respuesta Usuario' : 'Respuesta Abogado';
        const responseType = req.user.role === 'regular' ? 'regular' : 'lawyer';

        if (isOtrosiState && currentOtrosi) {
          // Para otrosí, usar OtrosiFile con otrosiId
          await fileStorageModel.create({
            filename: file.originalName,
            filepath: file.googleDriveFileId,
            category: 'Devuelto',
            fileType: 'Devuelto',
            responseType,
            contractId: contract.id,
            otrosiId: currentOtrosi.id,
            uploadedBy: req.user.id
          });
        } else {
          // Para contratos normales, usar ContractFile
          await fileStorageModel.create({
            filename: file.originalName,
            filepath: file.googleDriveFileId,
            category: 'Devuelto',
            fileType: 'Devuelto',
            responseType,
            contractId: contract.id
          });
        }
      }
    }

    await recordHistory({
      contractId: contract.id,
      userId: req.user.id,
      role: req.user.role,
      action: 'return',
      oldStatus: oldStatusReturn,
      newStatus: finalContractStatus,
      comment: comment || 'Contrato devuelto',
    });

    // Enviar notificaciones por email - PATRÓN ESTÁNDAR
    try {
      // Obtener datos del contrato con solicitante
      const contractWithSolicitante = await Contract.findByPk(contract.id, {
        include: [{ model: User, as: 'solicitante', attributes: ['email'] }]
      });

      const solicitanteEmail = contractWithSolicitante.solicitante?.email;

      // 1. Enviar "Estado del Contrato Actualizado" a TODOS (solicitante + abogados)
      const allEmails = [];
      
      // Agregar email del solicitante
      if (solicitanteEmail) {
        allEmails.push(solicitanteEmail);
      }
      
      // Agregar emails de abogados
      const lawyers = await User.findAll({
        where: { role: 'lawyer', status: 'approved' },
        attributes: ['email']
      });
      const lawyerEmails = lawyers.map(lawyer => lawyer.email);
      allEmails.push(...lawyerEmails);
      
      // DISABLED: Solo se envían notificaciones cuando se requiere acción
      // if (allEmails.length > 0) {
      //   await emailService.sendContractStatusChangeNotification(
      //     allEmails,
      //     {
      //       id: contract.id,
      //       descripcion: contract.descripcion,
      //       proveedor: contract.proveedor,
      //       valorTotal: contract.valorTotal,
      //       moneda: contract.moneda
      //     },
      //     oldStatusReturn,
      //     finalContractStatus
      //   );
      // }

      // 2. Enviar "Acción Requerida" SOLO a quien debe responder
      if (finalContractStatus === 'awaiting_user_response' || finalContractStatus === 'otrosi_awaiting_user_response') {
        // Notificar al usuario solicitante
        if (solicitanteEmail) {
          await emailService.sendContractActionRequiredNotification(
            solicitanteEmail,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            'respond',
            'regular'
          );
        }
      } else if (finalContractStatus === 'awaiting_lawyer_review' || finalContractStatus === 'otrosi_awaiting_lawyer_review') {
        // Notificar a los abogados
        if (lawyerEmails.length > 0) {
          await emailService.sendContractActionRequiredNotification(
            lawyerEmails,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            'review',
            'lawyer'
          );
        }
      }

    } catch (emailError) {
      console.error('❌ Error enviando emails:', emailError);
      // No fallar la operación por error de email
    }

    res.json({ message: 'Contrato devuelto exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test route to verify routing is working
router.get('/files/test', (req, res) => {
  console.log('🧪 TEST ROUTE HIT - routing is working!');
  res.json({ message: 'Test route working', timestamp: new Date() });
});

// Debug route to list all contract files
router.get('/files/debug', async (req, res) => {
  try {
    const ContractFile = require('../models/ContractFile');
    const files = await ContractFile.findAll({
      attributes: ['id', 'filename', 'filepath', 'category', 'fileType', 'contractId'],
      limit: 10,
      order: [['id', 'DESC']]
    });
    
    console.log('📋 Contract files in database:', files.length);
    files.forEach(file => {
      console.log(`  - File ID: ${file.id}, Name: ${file.filename}, Contract: ${file.contractId}`);
    });
    
    // Also check for the specific Google Drive ID
    const specificFile = await ContractFile.findOne({
      where: { filepath: '1CuCj19oo24bIOjURNigaMB-aHGa75v3Y' }
    });
    
    console.log('🔍 Specific Google Drive file found:', specificFile ? {
      id: specificFile.id,
      filename: specificFile.filename,
      filepath: specificFile.filepath,
      contractId: specificFile.contractId
    } : 'NOT FOUND');
    
    res.json({
      message: 'Contract files debug info',
      count: files.length,
      specificGoogleDriveFile: specificFile ? {
        id: specificFile.id,
        filename: specificFile.filename,
        filepath: specificFile.filepath,
        contractId: specificFile.contractId
      } : null,
      files: files.map(f => ({
        id: f.id,
        filename: f.filename,
        contractId: f.contractId,
        category: f.category,
        fileType: f.fileType,
        filepath: f.filepath,
        isGoogleDrive: f.filepath && f.filepath.length > 20 // Google Drive IDs are long
      }))
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/files/:fileId/download - Download a contract file
router.get('/files/:fileId/download', auth, async (req, res) => {
  try {
    console.log('🔍 CONTRACT FILE DOWNLOAD ENDPOINT HIT!');
    console.log('📥 Request params:', req.params);
    console.log('👤 User:', req.user.id, 'Role:', req.user.role);
    
    const { fileId } = req.params;
    const contractFileService = require('../services/contractFileService');
    
    console.log('📞 Calling contractFileService.streamFile...');

    // Use the ContractFileService to handle the download with proper access validation
    await contractFileService.streamFile(fileId, res, req.user.id, req.user.role);
    
    console.log('✅ contractFileService.streamFile completed');
    
  } catch (error) {
    console.error('❌ Error in contract file download endpoint:', error);
    console.error('❌ Error stack:', error.stack);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /api/contracts/files/:fileId/metadata - Get contract file metadata
router.get('/files/:fileId/metadata', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const contractFileService = require('../services/contractFileService');
    
    console.log('Contract file metadata requested:', {
      fileId,
      userId: req.user.id,
      userRole: req.user.role
    });

    const result = await contractFileService.getFileMetadata(fileId, req.user.id, req.user.role);
    
    if (!result.success) {
      const statusCode = result.error.includes('not found') ? 404 :
                        result.error.includes('Access denied') ? 403 : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json(result.metadata);
    
  } catch (error) {
    console.error('Error in contract file metadata endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
