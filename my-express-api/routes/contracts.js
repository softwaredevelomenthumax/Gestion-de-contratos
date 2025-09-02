const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Contract, ContractViewer } = require('../models/Contract');
const ContractFile = require('../models/ContractFile');
const User = require('../models/User');
const { recordHistory } = require('../services/traceability');
// const ContractHistory = require('../models/ContractHistory');
const auth = require('../middleware/auth');

const filesRouter = require('./files');
// Ensure associations are registered (Contract <-> User via ContractViewer)
require('../models/associations');
const { upload } = require('../middleware/upload');
const { validateContractAction, getNextStatus } = require('../middleware/contractAuth');

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

const contractIncludeOptions = [
  {
    model: User,
    as: 'solicitante',
    attributes: ['id', 'firstName', 'lastName', 'email']
  },
  {
    model: User,
    as: 'viewers',
    attributes: ['id', 'firstName', 'lastName', 'email'],
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
    attributes: ['id', 'contractId', 'numeroOtrosi', 'descripcionCambios', 'valorTotal', 'moneda', 'porcentajeIVA', 'valorIVA', 'formaPago', 'fechaInicio', 'fechaFinal', 'estado', 'cartaSolicitudPath', 'firmarOtrosiPath', 'firmaAbogadoPath', 'comentariosAbogado', 'fechaCreacion', 'fechaAprobacion', 'fechaDevolucion', 'firmadoPorUsuario']
  }
];

// GET /api/contracts - Contratos del usuario logueado
router.get('/', auth, async (req, res) => {
  try {
    let whereClause;
    
    if (req.user.role === 'lawyer') {
      // Los abogados pueden ver todos los contratos
      whereClause = {};
    } else {
      // Los usuarios regulares solo pueden ver sus propios contratos
      whereClause = { solicitanteId: req.user.id };
    }
    
    const contracts = await Contract.findAll({
      where: whereClause,
      include: contractIncludeOptions,
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
router.post('/', auth, upload.array('files', 10), async (req, res) => {
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
    
    // Procesar archivos si se enviaron
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        // Determinar categoría basada en el nombre del campo
        let category = 'contrato';
        let fileType = 'Contrato';
        
        if (file.fieldname === 'oferta') {
          category = 'oferta';
          fileType = 'Oferta';
        } else if (file.fieldname === 'camara') {
          category = 'camara';
          fileType = 'Cámara';
        }
        
        // Crear registro de archivo
        await ContractFile.create({
          filename: file.originalname,
          filepath: file.filename,
          category,
          fileType,
          responseType: 'regular',
          contractId: contract.id
        });
      }
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
    console.log('🔍 DEBUG - Endpoint /new llamado por usuario:', req.user.role, req.user.id);
    
    if (req.user.role !== 'lawyer') {
      console.log('❌ Usuario no es abogado, acceso denegado');
      return res.status(403).json({ error: 'Solo los abogados pueden acceder a esta información' });
    }
    
    console.log('✅ Usuario es abogado, buscando contratos con estado "new"');
    
    const contracts = await Contract.findAll({
      where: { estado: 'new' },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });
    
    console.log('📋 Contratos encontrados con estado "new":', contracts.length);
    console.log('📊 Estados de contratos encontrados:', contracts.map(c => ({ id: c.id, estado: c.estado })));
    
    res.json(contracts);
  } catch (error) {
    console.error('❌ Error en endpoint /new:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/contracts/returned
router.get('/returned', auth, async (req, res) => {
  try {
    console.log('🔍 DEBUG /returned: Buscando contratos devueltos...');
    
    // First, let's see all contract states in the database
    const allContracts = await Contract.findAll({
      attributes: ['id', 'estado', 'nombreSolicitante'],
      order: [['id', 'DESC']],
      limit: 20
    });
    console.log('🔍 DEBUG: Estados de todos los contratos:');
    allContracts.forEach(contract => {
      console.log(`  - Contract ID: ${contract.id}, Estado: ${contract.estado}, Solicitante: ${contract.nombreSolicitante}`);
    });
    
    // Contratos devueltos incluye tanto 'awaiting_lawyer_review' como 'otrosi_awaiting_lawyer_review'
    const contracts = await Contract.findAll({
      where: { 
        estado: ['awaiting_lawyer_review', 'otrosi_awaiting_lawyer_review'] 
      },
      include: contractIncludeOptions,
      order: [['id', 'DESC']],
    });
    
    console.log('🔍 DEBUG /returned: Contratos encontrados:', contracts.length);
    contracts.forEach(contract => {
      console.log(`  - Contract ID: ${contract.id}, Estado: ${contract.estado}, Solicitante: ${contract.nombreSolicitante}`);
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
      console.log('🔍 DEBUG: Todos los otrosi en la DB (últimos 10):');
      allOtrosi.forEach(o => {
        console.log(`  - Otrosi ID: ${o.id}, Contract ID: ${o.contractId}, Estado: ${o.estado}, Número: ${o.numeroOtrosi}`);
      });
      
      // Now check specifically for contracts in otrosi_awaiting_lawyer_review state
      const contractsInOtrosiState = await Contract.findAll({
        where: { estado: 'otrosi_awaiting_lawyer_review' },
        attributes: ['id', 'estado', 'nombreSolicitante']
      });
      console.log('🔍 DEBUG: Contratos en estado otrosi_awaiting_lawyer_review:');
      contractsInOtrosiState.forEach(c => {
        console.log(`  - Contract ID: ${c.id}, Estado: ${c.estado}, Solicitante: ${c.nombreSolicitante}`);
      });
      
      console.log('🔍 DEBUG: Buscando otrosi con estado otrosi_awaiting_lawyer_review...');
      const otrosiCount = await Otrosi.count({ where: { estado: 'otrosi_awaiting_lawyer_review' } });
      console.log('🔍 DEBUG: Otrosi encontrados:', otrosiCount);
      
      if (otrosiCount > 0) {
        const otrosiDetails = await Otrosi.findAll({
          where: { estado: 'otrosi_awaiting_lawyer_review' },
          attributes: ['id', 'contractId', 'estado', 'numeroOtrosi']
        });
        console.log('🔍 DEBUG: Detalles de otrosi:', otrosiDetails.map(o => ({ id: o.id, contractId: o.contractId, estado: o.estado })));
        
        const contractIds = otrosiDetails.map(o => o.contractId);
        console.log('🔍 DEBUG: Contract IDs extraídos:', contractIds);
        
        contractsWithOtrosiAwaitingLawyerReview = await Contract.findAll({
          where: { id: contractIds },
          include: contractIncludeOptions,
          order: [['id', 'DESC']],
        });
        console.log('🔍 DEBUG: Contratos con otrosi awaiting lawyer review encontrados:', contractsWithOtrosiAwaitingLawyerReview.length);
      }
    } catch (otrosiError) {
      console.error('❌ Error buscando otrosi awaiting lawyer review:', otrosiError);
      contractsWithOtrosiAwaitingLawyerReview = [];
    }

    const allContracts = [...contracts, ...contractsOtrosiSignedByUser, ...contractsWithOtrosiAwaitingSignature, ...contractsWithOtrosiAwaitingLawyerReview];
    console.log('🔍 DEBUG: Total contratos en respuesta final:', allContracts.length);
    console.log('🔍 DEBUG: Breakdown:');
    console.log(`  - awaiting_lawyer_review: ${contracts.length}`);
    console.log(`  - signature_otrosi_already_signedByUser: ${contractsOtrosiSignedByUser.length}`);
    console.log(`  - contractsWithOtrosiAwaitingSignature: ${contractsWithOtrosiAwaitingSignature.length}`);
    console.log(`  - contractsWithOtrosiAwaitingLawyerReview: ${contractsWithOtrosiAwaitingLawyerReview.length}`);
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

    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contracts/:id/respond
router.post('/:id/respond', auth, upload.array('files', 10), async (req, res) => {
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

    if (req.files && req.files.length > 0) {
        for (const file of req.files) {
        const category = req.user.role === 'regular' ? 'Respuesta Usuario' : 'Respuesta Abogado';
        const fileType = req.user.role === 'regular' ? 'Respuesta Usuario' : 'Respuesta Abogado';
        const responseType = req.user.role === 'regular' ? 'regular' : 'lawyer';

        const createData = {
              filename: file.originalname,
          filepath: file.filename,
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

    res.json({ message: 'Respuesta enviada exitosamente' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

// POST /api/contracts/:id/sign
router.post('/:id/sign', auth, upload.array('files', 10), async (req, res) => {
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

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const category = req.user.role === 'regular' ? 'Firma Usuario' : 'Firma Abogado';
        const fileType = req.user.role === 'regular' ? 'Firma Usuario' : 'Firma Abogado';
        const responseType = req.user.role === 'regular' ? 'regular' : 'lawyer';

        const createData = {
          filename: file.originalname,
          filepath: file.filename,
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

    res.json({ message: 'Firma enviada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/contracts/:id/return
router.post('/:id/return', auth, upload.array('files', 10), async (req, res) => {
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

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const category = req.user.role === 'regular' ? 'Respuesta Usuario' : 'Respuesta Abogado';
        const fileType = req.user.role === 'regular' ? 'Respuesta Usuario' : 'Respuesta Abogado';
        const responseType = req.user.role === 'regular' ? 'regular' : 'lawyer';

        await fileStorageModel.create({
          filename: file.originalname,
          filepath: file.filename,
          category,
          fileType,
          responseType,
          contractId: contract.id
        });
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

    res.json({ message: 'Contrato devuelto exitosamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
