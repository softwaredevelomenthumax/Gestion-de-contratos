const express = require('express');
const router = express.Router();

const Otrosi = require('../models/Otrosi');
const { Contract } = require('../models/Contract');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { upload, uploadOtrosi, uploadOtrosiWithGoogleDrive } = require('../middleware/upload');
const { validateOtrosiActionMiddleware, getNextOtrosiStatus } = require('../middleware/otrosiAuth');
const path = require('path');
const fs = require('fs');
const { recordHistory } = require('../services/traceability');
const googleDriveService = require('../services/googleDrive');
const emailService = require('../services/emailService');

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
      order: [['numeroOtrosi', 'ASC']],
      attributes: { 
        exclude: ['cartaSolicitudPath', 'firmarOtrosiPath', 'firmaAbogadoPath'] 
      }
    });

    res.json(otrosi);
  } catch (error) {
    console.error('Error fetching otrosi for contract:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/otrosi - Create a new otrosi
router.post('/', auth, uploadOtrosiWithGoogleDrive, async (req, res) => {
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

    // Handle Google Drive file uploads
    let cartaSolicitudPath = null;
    let firmarOtrosiPath = null;
    let firmaAbogadoPath = null;
    
    // Get Google Drive file IDs from the upload middleware
    if (req.googleDriveFiles && req.googleDriveFiles.cartaSolicitud) {
      cartaSolicitudPath = req.googleDriveFiles.cartaSolicitud.googleDriveFileId;
    }
    
    if (req.googleDriveFiles && req.googleDriveFiles.firmarOtrosi) {
      firmarOtrosiPath = req.googleDriveFiles.firmarOtrosi.googleDriveFileId;
    }

    if (req.googleDriveFiles && req.googleDriveFiles.firmaAbogado) {
      firmaAbogadoPath = req.googleDriveFiles.firmaAbogado.googleDriveFileId;
    }

    // Parse dates
    const parsedFechaInicio = fechaInicio ? new Date(fechaInicio) : null;
    const parsedFechaFinal = fechaFinal ? new Date(fechaFinal) : null;

    // Determine if user signed the otrosi based on Google Drive file upload
    const firmadoPorUsuario = !!(req.googleDriveFiles && req.googleDriveFiles.firmarOtrosi);

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

    // Handle enviarOtrosi file - create OtrosiFile record instead of storing in otrosi table
    if (req.googleDriveFiles && req.googleDriveFiles.enviarOtrosi) {
      const OtrosiFile = require('../models/OtrosiFile');
      
      await OtrosiFile.create({
        otrosiId: otrosi.id,
        contractId: otrosi.contractId,
        filename: req.googleDriveFiles.enviarOtrosi.originalName,
        filepath: req.googleDriveFiles.enviarOtrosi.googleDriveFileId,
        category: 'Enviar Otrosí',
        fileType: 'Enviar Otrosí',
        responseType: 'user',
        uploadedBy: req.user.id
      });
      
      console.log('✅ Created OtrosiFile record for enviarOtrosi:', {
        otrosiId: otrosi.id,
        filename: req.googleDriveFiles.enviarOtrosi.originalName,
        filepath: req.googleDriveFiles.enviarOtrosi.googleDriveFileId
      });
    }

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
      await contract.update({ estado: newStatus });
      await contract.reload(); // Reload to ensure we have the latest state
       // IMPORTANTE: También actualizar el estado del otrosí para que coincida
       await otrosi.update({ estado: 'otrosi_awaiting_lawyer_review' });
     }

     // Crear registros en OtrosiFile para los archivos subidos
     const OtrosiFile = require('../models/OtrosiFile');
     
     // Crear registro para carta de solicitud si existe
     if (cartaSolicitudPath && req.googleDriveFiles.cartaSolicitud) {
       const cartaFile = req.googleDriveFiles.cartaSolicitud;
       await OtrosiFile.create({
         otrosiId: otrosi.id,
         contractId: contract.id,
         filename: cartaFile.originalName,
         filepath: cartaFile.googleDriveFileId, // Store Google Drive file ID
         mimetype: 'application/pdf',
         size: cartaFile.size,
         category: 'Carta de Solicitud',
         fileType: 'Carta de Solicitud',
         responseType: 'user',
         uploadedBy: req.user.id,
         uploadedAt: new Date()
       });
       console.log('📄 Carta de solicitud guardada en OtrosiFile con Google Drive ID:', cartaFile.googleDriveFileId);
     }
     
     // Crear registro para firma del otrosí si existe
     if (firmarOtrosiPath && req.googleDriveFiles.firmarOtrosi) {
       const firmaFile = req.googleDriveFiles.firmarOtrosi;
       await OtrosiFile.create({
         otrosiId: otrosi.id,
         contractId: contract.id,
         filename: firmaFile.originalName,
         filepath: firmaFile.googleDriveFileId, // Store Google Drive file ID
         mimetype: 'application/pdf',
         size: firmaFile.size,
         category: 'Firma Usuario',
         fileType: 'Firma Usuario',
         responseType: 'user',
         uploadedBy: req.user.id,
         uploadedAt: new Date()
       });
       console.log('✍️ Firma del otrosí guardada en OtrosiFile con Google Drive ID:', firmaFile.googleDriveFileId);
     }
     
     // Log resumen de archivos procesados

    // Enviar notificaciones por email - PATRÓN ESTÁNDAR
    try {
      // Obtener datos del contrato con solicitante
      const contractWithSolicitante = await Contract.findByPk(contract.id, {
        include: [{ model: require('../models/User'), as: 'solicitante', attributes: ['email'] }]
      });

      const solicitanteEmail = contractWithSolicitante?.solicitante?.email;

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
      
      // Enviar estado actualizado a todos
      if (allEmails.length > 0) {
        await emailService.sendContractStatusChangeNotification(
          allEmails,
          {
            id: contract.id,
            descripcion: contract.descripcion,
            proveedor: contract.proveedor,
            valorTotal: contract.valorTotal,
            moneda: contract.moneda
          },
          oldStatus,
          newStatus
        );
      }

      // 2. Enviar "Acción Requerida" SOLO a quien debe responder
      if (newStatus === 'otrosi_awaiting_lawyer_review') {
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
      } else if (newStatus === 'signature_otrosi_already_signedByUser' || newStatus === 'otrosi_awaiting_signature') {
        // Notificar al usuario para firma
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

    } catch (emailErr) {
      console.error('❌ Error enviando emails:', emailErr);
      // No fallar la operación por error de email
    }

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

    // Enviar notificaciones por email - PATRÓN ESTÁNDAR
    try {
      // Obtener datos del contrato con solicitante
      const contractWithUser = await Contract.findByPk(otrosi.contractId, {
        include: [{ model: User, as: 'solicitante', attributes: ['email'] }]
      });

      const solicitanteEmail = contractWithUser?.solicitante?.email;

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
      
      // Determinar el estado anterior y nuevo
      const oldStatus = otrosi.firmadoPorUsuario ? 'otrosi_awaiting_signature' : 'otrosi_awaiting_lawyer_review';
      const newStatus = otrosi.firmadoPorUsuario ? 'signed' : 'otrosi_awaiting_signature';
      
      // Enviar estado actualizado a todos
      if (allEmails.length > 0) {
        await emailService.sendContractStatusChangeNotification(
          allEmails,
          {
            id: contract.id,
            descripcion: contract.descripcion,
            proveedor: contract.proveedor,
            valorTotal: contract.valorTotal,
            moneda: contract.moneda
          },
          oldStatus,
          newStatus
        );
      }

      // 2. Enviar "Acción Requerida" SOLO a quien debe responder
      if (otrosi.firmadoPorUsuario) {
        // Lawyer signed after user -> fully signed, no action required
      } else if (!otrosi.firmadoPorUsuario && solicitanteEmail) {
        // Now awaiting user's signature
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

    } catch (emailErr) {
      console.error('❌ Error enviando emails:', emailErr);
      // No fallar la operación por error de email
    }

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

// Middleware for otrosi action file uploads to Google Drive
const uploadOtrosiActionFiles = async (req, res, next) => {
  // Use multer to handle file validation and memory storage - no temp files!
  upload.array('files')(req, res, async (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    // If no files were uploaded, continue to the next middleware
    if (!req.files || req.files.length === 0) {
      return next();
    }

    try {
      const uploadedFiles = [];
      const contractId = req.params.id; // This is actually the otrosi ID, we'll get contract ID from the otrosi
      
      // Get otrosi to find contract ID and number
      const otrosi = await Otrosi.findByPk(contractId);
      if (!otrosi) {
        return res.status(404).json({ error: 'Otrosi not found' });
      }

      for (const file of req.files) {
        try {
          console.log(`Uploading otrosi action file to Google Drive from memory buffer:`, {
            originalName: file.originalname,
            bufferSize: file.buffer.length,
            contractId: otrosi.contractId,
            otrosiNumber: otrosi.numeroOtrosi
          });

          // Upload to Google Drive directly from memory buffer - no temp files!
          const googleDriveResult = await googleDriveService.uploadOtrosiFileFromBuffer(
            file.buffer,
            otrosi.contractId,
            otrosi.numeroOtrosi,
            file.originalname
          );

          // Store Google Drive information for later use
          uploadedFiles.push({
            originalFile: file,
            googleDriveFileId: googleDriveResult.id,
            googleDriveFileName: googleDriveResult.name,
            originalName: googleDriveResult.originalName,
            size: googleDriveResult.size,
            webViewLink: googleDriveResult.webViewLink
          });

          console.log(`Successfully uploaded otrosi action file to Google Drive:`, {
            fileId: googleDriveResult.id,
            fileName: googleDriveResult.name
          });

        } catch (uploadError) {
          console.error(`Error uploading otrosi action file to Google Drive:`, uploadError);
          
          // No temporary files to clean up - using memory storage! 🎉

          return res.status(500).json({ 
            error: `Failed to upload file to Google Drive: ${uploadError.message}` 
          });
        }
      }

      // No temporary files to clean up - using memory storage! 🎉

      // Attach Google Drive file information to the request
      req.googleDriveFiles = uploadedFiles;
      
      console.log('All otrosi action files successfully uploaded to Google Drive:', {
        contractId: otrosi.contractId,
        otrosiNumber: otrosi.numeroOtrosi,
        filesUploaded: uploadedFiles.length
      });

      next();
    } catch (error) {
      console.error('Error in otrosi action Google Drive upload middleware:', error);
      
      // No temporary files to clean up - using memory storage! 🎉

      return res.status(500).json({ 
        error: 'Internal server error during file upload' 
      });
    }
  });
};

// POST /api/otrosi/:id/action - Manejar acciones del otrosí (firmar, responder, aprobar, etc.)
router.post('/:id/action',
  auth,
  uploadOtrosiActionFiles,
  validateOtrosiActionMiddleware(['regular', 'lawyer'], ['pendiente', 'otrosi_awaiting_user_response', 'otrosi_awaiting_lawyer_review', 'otrosi_awaiting_signature']),
  async (req, res) => {
    try {
      const { action, comment } = req.body;
      const { otrosi } = req;
      
      
      const oldStatus = otrosi.estado;
      
      // Determinar el siguiente estado automáticamente
      const nextStatus = getNextOtrosiStatus(oldStatus, req.user.role, action);
      
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
        updateData.firmaAbogadoPath = req.googleDriveFiles?.[0]?.googleDriveFileId || null;
      }

      const updatedOtrosi = await otrosi.update(updateData);

      // Guardar archivos si se subieron a Google Drive
      let fileIds = [];
      if (req.googleDriveFiles && req.googleDriveFiles.length > 0) {
        const OtrosiFile = require('../models/OtrosiFile');
        for (const fileData of req.googleDriveFiles) {
          const savedFile = await OtrosiFile.create({
            otrosiId: otrosi.id,
            contractId: otrosi.contractId,
            filename: fileData.originalName,
            filepath: fileData.googleDriveFileId, // Store Google Drive file ID
            mimetype: 'application/pdf',
            size: fileData.size,
            category: action === 'sign' ? 'Firma' : 'Respuesta',
            fileType: action === 'sign' ? 
              (req.user.role === 'lawyer' ? 'Firma Abogado' : 'Firma Usuario') : 
              'Respuesta',
            responseType: req.user.role,
            uploadedBy: req.user.id,
            uploadedAt: new Date()
          });
          fileIds.push(savedFile.id);
          console.log('📄 Archivo de acción otrosí guardado con Google Drive ID:', fileData.googleDriveFileId);
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

      // Enviar notificaciones por email - PATRÓN ESTÁNDAR
      try {
        // Obtener datos del contrato con solicitante
        const contract = await Contract.findByPk(otrosi.contractId, {
          include: [{ model: User, as: 'solicitante', attributes: ['email'] }]
        });

        const solicitanteEmail = contract?.solicitante?.email;

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
        
        // Enviar estado actualizado a todos
        if (allEmails.length > 0) {
          await emailService.sendContractStatusChangeNotification(
            allEmails,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            oldStatus,
            nextStatus
          );
        }

        // 2. Enviar "Acción Requerida" SOLO a quien debe responder
        if (nextStatus === 'otrosi_awaiting_user_response' && solicitanteEmail) {
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
        } else if (nextStatus === 'otrosi_awaiting_lawyer_review' && lawyerEmails.length > 0) {
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
        } else if (nextStatus === 'otrosi_awaiting_signature' && solicitanteEmail) {
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
        } else if (nextStatus === 'otrosi_signed') {
          // Otrosí completamente firmado, no se requiere acción adicional
        }

      } catch (emailErr) {
        console.error('❌ Error enviando emails:', emailErr);
        // No fallar la operación por error de email
      }

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

// Test route for debugging
router.get('/:id/test-debug', auth, async (req, res) => {
  console.log('🧪 Params:', req.params);
  console.log('🧪 User:', req.user.role, req.user.id);
  res.json({ message: 'Debug test successful', id: req.params.id });
});

// POST /api/otrosi/:id/return - Devolver un otrosí (solo abogados)
router.post('/:id/return', 
  auth, 
  upload.array('files', 10),
  validateOtrosiActionMiddleware(['lawyer'], ['pendiente', 'otrosi_awaiting_lawyer_review', 'otrosi_awaiting_signature']),
  async (req, res) => {
    try {
      const { comentariosAbogado } = req.body;
      const { otrosi } = req;
      
      
      // Obtener el siguiente estado
      const nextStatus = getNextOtrosiStatus(otrosi.estado, req.user.role, 'return');
      
      // Actualizar otrosí al siguiente estado
      const updatedOtrosi = await otrosi.update({
        estado: nextStatus,
        comentariosAbogado: comentariosAbogado || null,
        fechaDevolucion: new Date()
      });

      // Actualizar estado del contrato si es necesario
      const contract = await Contract.findByPk(otrosi.contractId);
      if (nextStatus === 'otrosi_awaiting_user_response') {
        await contract.update({ estado: 'otrosi_awaiting_user_response' });
      }

      // Manejar archivos de devolución si se subieron
      if (req.files && req.files.length > 0) {
        const OtrosiFile = require('../models/OtrosiFile');
        for (const file of req.files) {
          await OtrosiFile.create({
            otrosiId: otrosi.id,
            contractId: otrosi.contractId,
            filename: file.originalname,
            filepath: file.filename,
            category: 'Devuelto',
            fileType: 'Devuelto',
            responseType: 'lawyer',
            uploadedBy: req.user.id
          });
        }
      }

      // Enviar notificaciones por email
      
      try {
        const contractWithUser = await Contract.findByPk(otrosi.contractId, {
          include: [{ model: User, as: 'solicitante', attributes: ['email'] }]
        });
        const solicitanteEmail = contractWithUser?.solicitante?.email;
        
        
        if (nextStatus === 'otrosi_awaiting_user_response' && solicitanteEmail) {
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
          
          // También enviar email de actualización de estado
          await emailService.sendContractStatusChangeNotification(
            solicitanteEmail,
            {
              id: contract.id,
              descripcion: contract.descripcion,
              proveedor: contract.proveedor,
              valorTotal: contract.valorTotal,
              moneda: contract.moneda
            },
            otrosi.estado,
            nextStatus
          );
          
          // También notificar a los abogados sobre la actualización de estado
          try {
            const lawyers = await User.findAll({
              where: { role: 'lawyer', status: 'approved' },
              attributes: ['email']
            });
            
            if (lawyers.length > 0) {
              const lawyerEmails = lawyers.map(lawyer => lawyer.email);
              await emailService.sendContractStatusChangeNotification(
                lawyerEmails,
                {
                  id: contract.id,
                  descripcion: contract.descripcion,
                  proveedor: contract.proveedor,
                  valorTotal: contract.valorTotal,
                  moneda: contract.moneda
                },
                otrosi.estado,
                nextStatus
              );
            }
          } catch (lawyerEmailErr) {
            console.error('❌ Error enviando email de actualización a abogados:', lawyerEmailErr);
          }
        } else {
          
          // Fallback: notify status change to solicitante if available
          if (solicitanteEmail) {
            await emailService.sendContractStatusChangeNotification(
              solicitanteEmail,
              {
                id: contract.id,
                descripcion: contract.descripcion,
                proveedor: contract.proveedor,
                valorTotal: contract.valorTotal,
                moneda: contract.moneda
              },
              otrosi.estado,
              nextStatus
            );
          }
        }
      } catch (emailErr) {
        console.error('❌ Error enviando email al devolver otrosí:', emailErr);
        console.error('❌ Error stack:', emailErr.stack);
      }

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
      order: [['uploadedAt', 'DESC']],
      attributes: { exclude: ['filepath'] } // Exclude filepath - frontend should use download endpoint
    });
    
    console.log('📋 Returning otrosi files:', files.length);
    files.forEach(file => {
      console.log(`  - File ID: ${file.id}, Name: ${file.filename}, Category: ${file.category}`);
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

// Debug route to check otrosi data
router.get('/debug', async (req, res) => {
  try {
    const Otrosi = require('../models/Otrosi');
    const OtrosiFile = require('../models/OtrosiFile');
    
    // Check for the specific Google Drive ID in Otrosi table
    const otrosiWithGoogleDriveId = await Otrosi.findOne({
      where: {
        [require('sequelize').Op.or]: [
          { cartaSolicitudPath: '1CuCj19oo24bIOjURNigaMB-aHGa75v3Y' },
          { firmarOtrosiPath: '1CuCj19oo24bIOjURNigaMB-aHGa75v3Y' },
          { firmaAbogadoPath: '1CuCj19oo24bIOjURNigaMB-aHGa75v3Y' }
        ]
      }
    });
    
    // Check in OtrosiFile table
    const otrosiFileWithGoogleDriveId = await OtrosiFile.findOne({
      where: { filepath: '1CuCj19oo24bIOjURNigaMB-aHGa75v3Y' }
    });
    
    console.log('🔍 Otrosi with Google Drive ID found:', otrosiWithGoogleDriveId ? {
      id: otrosiWithGoogleDriveId.id,
      contractId: otrosiWithGoogleDriveId.contractId,
      cartaSolicitudPath: otrosiWithGoogleDriveId.cartaSolicitudPath,
      firmarOtrosiPath: otrosiWithGoogleDriveId.firmarOtrosiPath,
      firmaAbogadoPath: otrosiWithGoogleDriveId.firmaAbogadoPath
    } : 'NOT FOUND');
    
    console.log('🔍 OtrosiFile with Google Drive ID found:', otrosiFileWithGoogleDriveId ? {
      id: otrosiFileWithGoogleDriveId.id,
      filename: otrosiFileWithGoogleDriveId.filename,
      filepath: otrosiFileWithGoogleDriveId.filepath,
      otrosiId: otrosiFileWithGoogleDriveId.otrosiId
    } : 'NOT FOUND');
    
    res.json({
      message: 'Otrosi debug info',
      otrosiWithGoogleDriveId: otrosiWithGoogleDriveId ? {
        id: otrosiWithGoogleDriveId.id,
        contractId: otrosiWithGoogleDriveId.contractId,
        cartaSolicitudPath: otrosiWithGoogleDriveId.cartaSolicitudPath,
        firmarOtrosiPath: otrosiWithGoogleDriveId.firmarOtrosiPath,
        firmaAbogadoPath: otrosiWithGoogleDriveId.firmaAbogadoPath
      } : null,
      otrosiFileWithGoogleDriveId: otrosiFileWithGoogleDriveId ? {
        id: otrosiFileWithGoogleDriveId.id,
        filename: otrosiFileWithGoogleDriveId.filename,
        filepath: otrosiFileWithGoogleDriveId.filepath,
        otrosiId: otrosiFileWithGoogleDriveId.otrosiId
      } : null
    });
  } catch (error) {
    console.error('Error in otrosi debug route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Temporary fix route to clear the problematic field
router.get('/fix-google-drive-path', async (req, res) => {
  try {
    const Otrosi = require('../models/Otrosi');
    
    // Update the problematic otrosi record
    const result = await Otrosi.update(
      { firmarOtrosiPath: null },
      { where: { id: 3 } }
    );
    
    console.log('🔧 Fixed otrosi record - cleared firmarOtrosiPath');
    
    res.json({
      message: 'Fixed otrosi record',
      updated: result[0] > 0
    });
  } catch (error) {
    console.error('Error in otrosi debug route:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/otrosi/files/:fileId/download - Download an otrosi file
router.get('/files/:fileId/download', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const otrosiFileService = require('../services/otrosiFileService');
    
    console.log('Otrosi file download requested:', {
      fileId,
      userId: req.user.id,
      userRole: req.user.role
    });

    // Use the OtrosiFileService to handle the download with proper access validation
    await otrosiFileService.streamFile(fileId, res, req.user.id, req.user.role);
    
  } catch (error) {
    console.error('Error in otrosi file download endpoint:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// GET /api/otrosi/files/:fileId/metadata - Get otrosi file metadata
router.get('/files/:fileId/metadata', auth, async (req, res) => {
  try {
    const { fileId } = req.params;
    const otrosiFileService = require('../services/otrosiFileService');
    
    console.log('Otrosi file metadata requested:', {
      fileId,
      userId: req.user.id,
      userRole: req.user.role
    });

    const result = await otrosiFileService.getFileMetadata(fileId, req.user.id, req.user.role);
    
    if (!result.success) {
      const statusCode = result.error.includes('not found') ? 404 :
                        result.error.includes('Access denied') ? 403 : 500;
      return res.status(statusCode).json({ error: result.error });
    }

    res.json(result.metadata);
    
  } catch (error) {
    console.error('Error in otrosi file metadata endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
// GET /api/otrosi/admin/analyze-files - Analyze OtrosiFile records for issues
router.get('/admin/analyze-files', auth, async (req, res) => {
  try {
    // Only allow lawyers to access this admin endpoint
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Access denied. Only lawyers can access admin endpoints.' });
    }

    const OtrosiFile = require('../models/OtrosiFile');
    const googleDriveService = require('../services/googleDrive');
    const fs = require('fs');
    const path = require('path');

    // Find all OtrosiFile records
    const allOtrosiFiles = await OtrosiFile.findAll({
      attributes: ['id', 'filename', 'filepath', 'contractId', 'otrosiId', 'uploadedAt'],
      order: [['id', 'ASC']]
    });

    const analysis = {
      total: allOtrosiFiles.length,
      googleDriveFiles: [],
      localFiles: [],
      problematicFiles: [],
      missingFiles: []
    };

    // Analyze each file
    for (const file of allOtrosiFiles) {
      const isGoogleDriveId = googleDriveService.isGoogleDriveFileId(file.filepath);
      
      if (isGoogleDriveId) {
        analysis.googleDriveFiles.push({
          id: file.id,
          filename: file.filename,
          filepath: file.filepath,
          contractId: file.contractId,
          otrosiId: file.otrosiId,
          uploadedAt: file.uploadedAt
        });
      } else {
        // Check if it looks like a local file path
        if (file.filepath.includes('.pdf') || file.filepath.includes('uploads/')) {
          // Check if the local file actually exists
          const possiblePaths = [
            path.resolve(file.filepath),
            path.resolve(__dirname, '../uploads', file.filepath),
            path.resolve(__dirname, '../', file.filepath)
          ];

          let fileExists = false;
          let existingPath = null;

          for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
              fileExists = true;
              existingPath = possiblePath;
              break;
            }
          }

          const fileInfo = {
            id: file.id,
            filename: file.filename,
            filepath: file.filepath,
            contractId: file.contractId,
            otrosiId: file.otrosiId,
            uploadedAt: file.uploadedAt,
            exists: fileExists,
            existingPath: existingPath
          };

          if (fileExists) {
            analysis.localFiles.push(fileInfo);
          } else {
            analysis.missingFiles.push(fileInfo);
          }
        } else {
          analysis.problematicFiles.push({
            id: file.id,
            filename: file.filename,
            filepath: file.filepath,
            contractId: file.contractId,
            otrosiId: file.otrosiId,
            uploadedAt: file.uploadedAt
          });
        }
      }
    }

    // Add summary counts
    analysis.summary = {
      googleDriveFiles: analysis.googleDriveFiles.length,
      localFiles: analysis.localFiles.length,
      missingFiles: analysis.missingFiles.length,
      problematicFiles: analysis.problematicFiles.length
    };

    res.json({
      success: true,
      message: 'OtrosiFile analysis completed',
      analysis
    });

  } catch (error) {
    console.error('Error in analyze-files endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/otrosi/admin/migrate-file/:id - Migrate a specific local file to Google Drive
router.post('/admin/migrate-file/:id', auth, async (req, res) => {
  try {
    // Only allow lawyers to access this admin endpoint
    if (req.user.role !== 'lawyer') {
      return res.status(403).json({ error: 'Access denied. Only lawyers can access admin endpoints.' });
    }

    const fileId = parseInt(req.params.id);
    const OtrosiFile = require('../models/OtrosiFile');
    const googleDriveService = require('../services/googleDrive');
    const fs = require('fs');
    const path = require('path');

    // Find the file record
    const otrosiFile = await OtrosiFile.findByPk(fileId, {
      include: [
        {
          model: require('../models/Otrosi'),
          as: 'otrosi',
          attributes: ['id', 'numeroOtrosi']
        }
      ]
    });

    if (!otrosiFile) {
      return res.status(404).json({ error: 'OtrosiFile not found' });
    }

    // Check if it's already a Google Drive file
    if (googleDriveService.isGoogleDriveFileId(otrosiFile.filepath)) {
      return res.json({
        success: true,
        message: 'File is already stored in Google Drive',
        fileId: otrosiFile.filepath
      });
    }

    // Try to find the local file
    const possiblePaths = [
      path.resolve(otrosiFile.filepath),
      path.resolve(__dirname, '../uploads', otrosiFile.filepath),
      path.resolve(__dirname, '../', otrosiFile.filepath)
    ];

    let localFilePath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        localFilePath = possiblePath;
        break;
      }
    }

    if (!localFilePath) {
      return res.status(404).json({ 
        error: 'Local file not found. Cannot migrate to Google Drive.',
        triedPaths: possiblePaths
      });
    }

    // Upload to Google Drive
    const otrosiNumber = otrosiFile.otrosi ? otrosiFile.otrosi.numeroOtrosi : 1;
    const googleDriveResult = await googleDriveService.uploadOtrosiFile(
      localFilePath,
      otrosiFile.contractId,
      otrosiNumber,
      otrosiFile.filename
    );

    // Update the database record
    await otrosiFile.update({
      filepath: googleDriveResult.id
    });

    // Clean up the local file
    try {
      fs.unlinkSync(localFilePath);
      console.log(`Cleaned up local file: ${localFilePath}`);
    } catch (cleanupError) {
      console.warn('Could not clean up local file:', cleanupError.message);
    }

    res.json({
      success: true,
      message: 'File successfully migrated to Google Drive',
      googleDriveFileId: googleDriveResult.id,
      googleDriveFileName: googleDriveResult.name,
      originalLocalPath: localFilePath
    });

  } catch (error) {
    console.error('Error in migrate-file endpoint:', error);
    res.status(500).json({ error: error.message });
  }
});