const express = require('express');
const router = express.Router();
const Otrosi = require('../models/Otrosi');
const { Contract } = require('../models/Contract');
const auth = require('../middleware/auth');
const { upload, uploadOtrosi } = require('../middleware/upload');
const { validateOtrosiActionMiddleware, getNextOtrosiStatus } = require('../middleware/otrosiAuth');
const path = require('path');
const fs = require('fs');
const { recordHistory } = require('../services/traceability');

// GET /api/otrosi - Get all otrosi for the authenticated user
router.get('/', auth, async (req, res) => {
  try {
    let whereClause;
    if (req.user.role === 'lawyer') {
      // Lawyers can see all otrosi
      whereClause = {};
    } else {
      // Regular users can only see otrosi from their own contracts
      const userContracts = await Contract.findAll({
        where: { solicitanteId: req.user.id },
        attributes: ['id']
      });
      const contractIds = userContracts.map(contract => contract.id);
      whereClause = { contractId: contractIds };
    }
    
    const otrosi = await Otrosi.findAll({
      where: whereClause,
      include: [{
        model: Contract,
        as: 'contract',
        attributes: ['id', 'nombreSolicitante', 'estado']
      }],
      order: [['contractId', 'ASC'], ['numeroOtrosi', 'ASC']]
    });

    res.json(otrosi);
  } catch (error) {
    console.error('Error fetching otrosi:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/otrosi/contract/:contractId - Get all otrosi for a specific contract
router.get('/contract/:contractId', auth, async (req, res) => {
  try {
    const { contractId } = req.params;
    
    // Check if contract exists
    const contract = await Contract.findByPk(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Check if user has access to this contract
    if (req.user.role !== 'lawyer' && contract.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const otrosi = await Otrosi.findAll({
      where: { contractId },
      order: [['numeroOtrosi', 'ASC']]
    });

    res.json(otrosi);
  } catch (error) {
    console.error('Error fetching otrosi for contract:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/otrosi - Create a new otrosi
router.post('/', auth, uploadOtrosi, async (req, res) => {
  try {
    const {
      contractId,
      descripcionCambios,
      valorTotal,
      moneda,
      porcentajeIVA,
      valorIVA,
      formaPago,
      fechaInicio,
      fechaFinal,
      firmarOtrosi
    } = req.body;

    // Validate required fields
    if (!contractId || !descripcionCambios) {
      return res.status(400).json({ error: 'Contract ID and description are required' });
    }

    // Check if contract exists
    const contract = await Contract.findByPk(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user has access to this contract
    if (req.user.role !== 'lawyer' && contract.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if contract is signed (only signed contracts allow otrosi)
    if (contract.estado !== 'signed') {
      return res.status(400).json({ error: 'Otrosi can only be created for signed contracts' });
    }

    // Get the next sequential number for this contract
    const lastOtrosi = await Otrosi.findOne({
      where: { contractId },
      order: [['numeroOtrosi', 'DESC']]
    });
    
    const numeroOtrosi = lastOtrosi ? lastOtrosi.numeroOtrosi + 1 : 1;

    // Handle file uploads and create OtrosiFile records
    let cartaSolicitudPath = null;
    let firmarOtrosiPath = null;
    let firmaAbogadoPath = null;
    
    if (req.files && req.files.cartaSolicitud) {
      cartaSolicitudPath = req.files.cartaSolicitud[0].filename;
    }
    
    if (req.files && req.files.firmarOtrosi) {
      firmarOtrosiPath = req.files.firmarOtrosi[0].filename;
    }

    if (req.files && req.files.firmaAbogado) {
      firmaAbogadoPath = req.files.firmaAbogado[0].filename;
    }

    // Parse dates
    const parsedFechaInicio = fechaInicio ? new Date(fechaInicio) : null;
    const parsedFechaFinal = fechaFinal ? new Date(fechaFinal) : null;

    // Determine if user signed the otrosi based on file upload
    const firmadoPorUsuario = !!(req.files && req.files.firmarOtrosi);

    const otrosi = await Otrosi.create({
      contractId,
      numeroOtrosi,
      descripcionCambios,
      valorTotal: valorTotal || null,
      moneda: moneda || null,
      porcentajeIVA: porcentajeIVA || null,
      valorIVA: valorIVA || null,
      formaPago: formaPago || null,
      fechaInicio: parsedFechaInicio,
      fechaFinal: parsedFechaFinal,
      cartaSolicitudPath,
      firmarOtrosiPath,
      firmaAbogadoPath,

      estado: 'pendiente',
      firmadoPorUsuario
    });

         // Update contract state based on signature choice
     const oldStatus = contract.estado;
     let newStatus;
     
     if (firmadoPorUsuario) {
       // Si el usuario firma el otrosí, el contrato va a signature_otrosi_already_signedByUser
       newStatus = 'signature_otrosi_already_signedByUser';
       await contract.update({ estado: newStatus });
       // También actualizar el estado del otrosí para reflejar que ya fue firmado por el usuario
       await otrosi.update({ estado: 'otrosi_awaiting_signature' });
     } else {
       // Si el usuario NO firma el otrosí, el contrato va a otrosi_awaiting_lawyer_review
       // El abogado debe revisar y aprobar antes de que vaya a firma
       newStatus = 'otrosi_awaiting_lawyer_review';
       console.log('🔍 DEBUG: Setting contract state to:', newStatus);
       await contract.update({ estado: newStatus });
       await contract.reload(); // Reload to ensure we have the latest state
       console.log('🔍 DEBUG: Contract state after update and reload:', contract.estado);
       // IMPORTANTE: También actualizar el estado del otrosí para que coincida
       await otrosi.update({ estado: 'otrosi_awaiting_lawyer_review' });
       console.log('🔍 DEBUG: Otrosi state updated to: otrosi_awaiting_lawyer_review');
     }

     // Crear registros en OtrosiFile para los archivos subidos
     const OtrosiFile = require('../models/OtrosiFile');
     
     // Crear registro para carta de solicitud si existe
     if (cartaSolicitudPath) {
       await OtrosiFile.create({
         otrosiId: otrosi.id,
         contractId: contract.id,
         filename: req.files.cartaSolicitud[0].originalname,
         filepath: req.files.cartaSolicitud[0].path,
         category: 'Carta de Solicitud',
         fileType: 'Carta de Solicitud',
         responseType: 'user',
         uploadedBy: req.user.id,
         uploadedAt: new Date()
       });
       console.log('📄 Carta de solicitud guardada en OtrosiFile');
     }
     
     // Crear registro para firma del otrosí si existe
     if (firmarOtrosiPath) {
       await OtrosiFile.create({
         otrosiId: otrosi.id,
         contractId: contract.id,
         filename: req.files.firmarOtrosi[0].originalname,
         filepath: req.files.firmarOtrosi[0].path,
         category: 'Firma Usuario',
         fileType: 'Firma Usuario',
         responseType: 'user',
         uploadedBy: req.user.id,
         uploadedAt: new Date()
       });
       console.log('✍️ Firma del otrosí guardada en OtrosiFile');
     }
     
     // Log resumen de archivos procesados
     console.log('📊 RESUMEN DE ARCHIVOS OTROSÍ:');
     console.log(`   Otrosí ID: ${otrosi.id}`);
     console.log(`   Contrato ID: ${contract.id}`);
     console.log(`   Carta de solicitud: ${cartaSolicitudPath ? 'SÍ' : 'NO'}`);
     console.log(`   Firma del otrosí: ${firmarOtrosiPath ? 'SÍ' : 'NO'}`);
     console.log(`   Estado del contrato: ${oldStatus} → ${newStatus}`);
     console.log(`   Firmado por usuario: ${firmadoPorUsuario ? 'SÍ' : 'NO'}`);
     console.log('🔍 DEBUG: Final contract state before response:', contract.estado);

    try {
      const { recordHistory } = require('../services/traceability');
      await recordHistory({
        contractId: contract.id,
        userId: req.user.id,
        role: req.user.role,
        action: 'otrosi_created',
        oldStatus: oldStatus,
        newStatus: newStatus,
        comment: `Otrosí #${numeroOtrosi} creado: ${descripcionCambios}`,
      });
    } catch (_) {}

    res.status(201).json({
      message: `Otrosi #${numeroOtrosi} created successfully`,
      otrosi,
      contractState: newStatus,
      filesProcessed: {
        cartaSolicitud: !!cartaSolicitudPath,
        firmarOtrosi: !!firmarOtrosiPath,
        total: [cartaSolicitudPath, firmarOtrosiPath].filter(Boolean).length
      },
      firmadoPorUsuario
    });
  } catch (error) {
    console.error('Error creating otrosi:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/otrosi/:id - Update an otrosi
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const otrosi = await Otrosi.findByPk(id);
    
    if (!otrosi) {
      return res.status(404).json({ error: 'Otrosi not found' });
    }

    // Check if user has access to this otrosi
    const contract = await Contract.findByPk(otrosi.contractId);
    if (req.user.role !== 'lawyer' && contract.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow updates if otrosi is pending
    if (otrosi.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Cannot update approved/rejected otrosi' });
    }

    const updatedOtrosi = await otrosi.update(req.body);
    res.json(updatedOtrosi);
  } catch (error) {
    console.error('Error updating otrosi:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/otrosi/:id - Delete an otrosi
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const otrosi = await Otrosi.findByPk(id);
    
    if (!otrosi) {
      return res.status(404).json({ error: 'Otrosi not found' });
    }

    // Check if user has access to this otrosi
    const contract = await Contract.findByPk(otrosi.contractId);
    if (req.user.role !== 'lawyer' && contract.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only allow deletion if otrosi is pending
    if (otrosi.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Cannot delete approved/rejected otrosi' });
    }

    // Delete associated file if it exists
    if (otrosi.cartaSolicitudPath) {
      const filePath = path.join(__dirname, '../uploads', otrosi.cartaSolicitudPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await otrosi.destroy();
    res.json({ message: 'Otrosi deleted successfully' });
  } catch (error) {
    console.error('Error deleting otrosi:', error);
    res.status(500).json({ error: error.message });
  }
});



// POST /api/otrosi/:id/sign - Lawyer signs an otrosi
router.post('/:id/sign', auth, upload.single('firmaAbogado'), async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Only lawyers can sign otrosi' });
    }

    const { id } = req.params;
    const { comentariosAbogado } = req.body;
    
    const otrosi = await Otrosi.findByPk(id);
    if (!otrosi) {
      return res.status(404).json({ error: 'Otrosi not found' });
    }

    if (otrosi.estado !== 'pendiente') {
      return res.status(400).json({ error: 'Otrosi is not pending approval' });
    }

    // Handle lawyer signature file
    let firmaAbogadoPath = null;
    if (req.file) {
      firmaAbogadoPath = req.file.filename;
    }

    // Update otrosi with lawyer signature and comments
    const updatedOtrosi = await otrosi.update({
      firmaAbogadoPath,
      comentariosAbogado: comentariosAbogado || null,
      estado: 'firmado'
    });

    // Update contract state based on whether user already signed
    const contract = await Contract.findByPk(otrosi.contractId);
    if (otrosi.firmadoPorUsuario) {
      // If user already signed, contract goes directly to 'signed' state
      await contract.update({ estado: 'signed' });
    } else {
      // If user didn't sign, contract goes to 'otrosi_awaiting_signature' state
      await contract.update({ estado: 'otrosi_awaiting_signature' });
    }

    try {
      const { recordHistory } = require('../services/traceability');
      await recordHistory({
        contractId: contract.id,
        userId: req.user.id,
        role: req.user.role,
        action: 'otrosi_signed_by_lawyer',
        oldStatus: 'pendiente',
        newStatus: 'firmado',
        comment: `Otrosí #${otrosi.numeroOtrosi} firmado por abogado: ${comentariosAbogado || 'Sin comentarios'}`,
      });
    } catch (_) {}

    res.json({
      message: 'Otrosi signed successfully by lawyer',
      otrosi: updatedOtrosi,
      contractState: contract.estado
    });
  } catch (error) {
    console.error('Error signing otrosi:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/otrosi/:id/action - Manejar acciones del otrosí (firmar, responder, aprobar, etc.)
router.post('/:id/action', 
  auth, 
  upload.array('files'),
  validateOtrosiActionMiddleware(['regular', 'lawyer'], ['pendiente', 'otrosi_awaiting_user_response', 'otrosi_awaiting_lawyer_review', 'otrosi_awaiting_signature']),
  async (req, res) => {
    try {
      const { action, comment } = req.body;
      const { otrosi } = req;
      
      console.log('Estado actual del otrosí:', otrosi.estado);
      console.log('Rol usuario:', req.user.role);
      console.log('Acción solicitada:', action);
      
      const oldStatus = otrosi.estado;
      
      // Determinar el siguiente estado automáticamente
      const nextStatus = getNextOtrosiStatus(oldStatus, req.user.role, action);
      console.log('Siguiente estado calculado:', nextStatus);
      
      if (!nextStatus) {
        return res.status(400).json({ 
          error: `Transición de estado no válida desde ${oldStatus} para rol ${req.user.role} con acción ${action}` 
        });
      }

      // Validar que se requiere al menos un archivo para ciertas acciones
      if ((action === 'sign' || action === 'respond') && (!req.files || req.files.length === 0)) {
        return res.status(400).json({ 
          error: 'Debes subir al menos un archivo PDF.' 
        });
      }
      
      // Validar comentario obligatorio para devolución
      if (action === 'return' && !comment?.trim()) {
        return res.status(400).json({ 
          error: 'El comentario es obligatorio para devolver un otrosí.' 
        });
      }

      // Actualizar otrosí
      const updateData = {
        estado: nextStatus
      };

      // Agregar comentarios según la acción
      if (comment) {
        if (req.user.role === 'lawyer') {
          updateData.comentariosAbogado = comment;
        }
      }

      // Agregar fechas según el estado
      if (nextStatus === 'otrosi_awaiting_signature') {
        updateData.fechaAprobacion = new Date();
      } else if (nextStatus === 'otrosi_signed') {
        updateData.firmaAbogadoPath = req.files?.[0]?.filename || null;
      }

      const updatedOtrosi = await otrosi.update(updateData);

      // Guardar archivos si se subieron
      let fileIds = [];
      if (req.files && req.files.length > 0) {
        const OtrosiFile = require('../models/OtrosiFile');
        for (const file of req.files) {
          const savedFile = await OtrosiFile.create({
            otrosiId: otrosi.id,
            contractId: otrosi.contractId,
            filename: file.originalname,
            filepath: file.path,
            category: action === 'sign' ? 'Firma' : 'Respuesta',
            fileType: action === 'sign' ? 
              (req.user.role === 'lawyer' ? 'Firma Abogado' : 'Firma Usuario') : 
              'Respuesta',
            responseType: req.user.role,
            uploadedBy: req.user.id,
            uploadedAt: new Date()
          });
          fileIds.push(savedFile.id);
        }
      }

             // Actualizar estado del contrato según el estado del otrosí
       const contract = await Contract.findByPk(otrosi.contractId);
       if (nextStatus === 'otrosi_awaiting_user_response') {
         await contract.update({ estado: 'otrosi_awaiting_user_response' });
       } else if (nextStatus === 'otrosi_awaiting_lawyer_review') {
         await contract.update({ estado: 'otrosi_awaiting_lawyer_review' });
       } else if (nextStatus === 'otrosi_awaiting_signature') {
         await contract.update({ estado: 'otrosi_awaiting_signature' });
       } else if (nextStatus === 'otrosi_signed') {
         // Cuando el otrosí está completado (firmado)
         // Si el contrato estaba en signature_otrosi_already_signedByUser, va a signed
         // Si no, mantiene el estado signed (ya que venía de otrosi_awaiting_signature)
         if (contract.estado === 'signature_otrosi_already_signedByUser' || 
             contract.estado === 'otrosi_awaiting_signature') {
           await contract.update({ estado: 'signed' });
         }
       }

             // Registrar en historial del contrato
       const ContractHistory = require('../models/ContractHistory');
       const historyAction = action === 'sign' ? 'otrosi_signed' : 
                            action === 'return' ? 'otrosi_returned' :
                            req.user.role === 'lawyer' ? 'lawyer_responded_to_otrosi' : 'user_responded_to_otrosi';

      const historyEntry = {
        contractId: contract.id,
        userId: req.user.id,
        role: req.user.role,
        action: historyAction,
        oldStatus,
        newStatus: nextStatus,
        comment: comment || `Otrosí #${otrosi.numeroOtrosi}: ${action}`,
        timestamp: new Date(),
      };

      try {
        const { recordHistory } = require('../services/traceability');
        const historyAction = action === 'sign' ? 'otrosi_signed' : 
                             action === 'return' ? 'otrosi_returned' :
                             req.user.role === 'lawyer' ? 'lawyer_responded_to_otrosi' : 'user_responded_to_otrosi';

        await recordHistory({
          contractId: contract.id,
          userId: req.user.id,
          role: req.user.role,
          action: historyAction,
          oldStatus: oldStatus,
          newStatus: nextStatus,
          comment: comment || `Otrosí #${otrosi.numeroOtrosi}: ${action}`,
        });
      } catch (_) {}

      console.log('Acción de otrosí exitosa');
             res.json({ 
         success: true, 
         otrosi: updatedOtrosi,
         contractState: contract.estado,
         message: `Otrosí ${action === 'sign' ? 'firmado' : 
                   action === 'return' ? 'devuelto' : 
                   'procesado'} exitosamente`
       });
    } catch (error) {
      console.error('Error en endpoint action de otrosí:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/otrosi/:id/return - Devolver un otrosí (solo abogados)
router.post('/:id/return', 
  auth, 
  validateOtrosiActionMiddleware(['lawyer'], ['pendiente', 'otrosi_awaiting_lawyer_review']),
  async (req, res) => {
    try {
      const { comentariosAbogado } = req.body;
      const { otrosi } = req;
      
      // Obtener el siguiente estado
      const nextStatus = getNextOtrosiStatus(otrosi.estado, req.user.role, 'return');
      
      // Actualizar otrosí al siguiente estado
      const updatedOtrosi = await otrosi.update({
        estado: nextStatus,
        comentariosAbogado: comentariosAbogado || comment || null,
        fechaDevolucion: new Date()
      });

      // Actualizar estado del contrato si es necesario
      const contract = await Contract.findByPk(otrosi.contractId);
      if (nextStatus === 'otrosi_awaiting_user_response') {
        await contract.update({ estado: 'otrosi_awaiting_user_response' });
      }

      // Historial deshabilitado temporalmente

      res.json({
        message: 'Otrosí devuelto exitosamente',
        otrosi: updatedOtrosi,
        contractState: contract.estado
      });
    } catch (error) {
      console.error('Error devolviendo otrosí:', error);
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/otrosi/:id/files - Obtener archivos de un otrosí específico
router.get('/:id/files', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const OtrosiFile = require('../models/OtrosiFile');
    
    const files = await OtrosiFile.findAll({
      where: { otrosiId: id },
      order: [['uploadedAt', 'DESC']]
    });
    
    res.json(files);
  } catch (error) {
    console.error('Error obteniendo archivos de otrosí:', error);
    res.status(500).json({ error: error.message });
  }
});

// TEMPORAL: Endpoint para corregir estados de otrosi inconsistentes
router.post('/fix-states', auth, async (req, res) => {
  try {
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Solo los abogados pueden ejecutar esta corrección' });
    }

    console.log('🔧 Iniciando corrección de estados de otrosi...');
    
    // Buscar contratos en estado otrosi_awaiting_lawyer_review
    const contractsInOtrosiState = await Contract.findAll({
      where: { estado: 'otrosi_awaiting_lawyer_review' },
      attributes: ['id', 'estado']
    });
    
    console.log(`📋 Encontrados ${contractsInOtrosiState.length} contratos en estado otrosi_awaiting_lawyer_review`);
    
    let updatedCount = 0;
    for (const contract of contractsInOtrosiState) {
      // Buscar otrosi de este contrato que estén en estado 'pendiente'
      const otrosiToUpdate = await Otrosi.findAll({
        where: { 
          contractId: contract.id,
          estado: 'pendiente'
        }
      });
      
      for (const otrosi of otrosiToUpdate) {
        await otrosi.update({ estado: 'otrosi_awaiting_lawyer_review' });
        console.log(`✅ Actualizado otrosi ${otrosi.id} del contrato ${contract.id}: pendiente → otrosi_awaiting_lawyer_review`);
        updatedCount++;
      }
    }
    
    console.log(`🎉 Corrección completada. ${updatedCount} otrosi actualizados.`);
    res.json({ 
      message: 'Estados de otrosi corregidos exitosamente',
      updatedCount,
      contractsChecked: contractsInOtrosiState.length
    });
  } catch (error) {
    console.error('❌ Error corrigiendo estados:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
