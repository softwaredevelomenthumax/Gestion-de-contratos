const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const ContractHistory = require('../models/ContractHistory');
const { Contract } = require('../models/Contract');

// Mapeo de estados a etiquetas legibles
function statusLabel(status) {
  const map = {
    new: 'Nuevo',
    respondido: 'Respondido',
    'para responder': 'Para responder',
    returned: 'Devuelto',
    signed: 'Firmado',
    vencido: 'Vencido',
    seen: 'Visto',
    awaiting_user_response: 'Esperando respuesta del usuario',
    awaiting_lawyer_review: 'En revisión por el abogado',
    awaiting_signature: 'Esperando firma',
    signature_otrosi_already_signedByUser: 'Otrosí firmado por usuario - Esperando aprobación del abogado',
    otrosi_awaiting_user_response: 'Otrosí devuelto - Esperando correcciones del usuario',
    otrosi_awaiting_lawyer_review: 'Otrosí en revisión por el abogado',
    otrosi_awaiting_signature: 'Otrosí aprobado - Esperando firma final',
    otrosi_signed: 'Otrosí completado y firmado',
    rechazado: 'Rechazado',
    devuelto: 'Devuelto',
  };
  return map[status] || status || 'Desconocido';
}

// GET /api/traceability/contracts/:id - Obtener historial de un contrato
router.get('/contracts/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findByPk(id);
    if (!contract) {
      return res.status(404).json({ error: 'Contrato no encontrado' });
    }

    // Usuarios regulares solo pueden ver su propio contrato
    if (req.user.role !== 'lawyer' && contract.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Obtener historial
    const histories = await ContractHistory.findAll({
      where: { contractId: id },
      order: [['timestamp', 'ASC']],
      raw: true,
    });

    // Enriquecer con datos básicos de usuario
    const UserModel = require('../models/User');
    const userIds = [...new Set(histories.map(h => h.user_id || h.userId).filter(Boolean))];
    const users = userIds.length > 0
      ? await UserModel.findAll({
          where: { id: userIds },
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
          raw: true,
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    let result = histories.map(h => ({
      id: h.id,
      action: h.action,
      oldStatus: h.old_status || h.oldStatus || null,
      newStatus: h.new_status || h.newStatus || null,
      comment: h.comment || null,
      fileId: h.file_id || h.fileId || null,
      timestamp: h.timestamp,
      user: (h.user_id && userMap.get(h.user_id)) || (h.userId && userMap.get(h.userId)) || null,
    }));

    // Fallback: si no hay historial, devolver entradas sintéticas mínimas
    if (result.length === 0) {
      const UserModel = require('../models/User');
      const sol = await UserModel.findByPk(contract.solicitanteId, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        raw: true,
      });

      // 1) Creación del contrato
      result.push({
        id: 0,
        action: 'created',
        oldStatus: null,
        newStatus: 'new',
        comment: 'El contrato fue creado y enviado para revisión',
        fileId: null,
        timestamp: contract.fechaIngreso || contract.createdAt || new Date(),
        user: sol || null,
      });

      // 2) Estado actual del contrato (instantánea)
      result.push({
        id: -1,
        action: 'status_snapshot',
        oldStatus: null,
        newStatus: contract.estado || null,
        comment: contract.estado ? `Estado actual: ${statusLabel(contract.estado)}` : null,
        fileId: null,
        timestamp: contract.updatedAt || contract.fechaIngreso || contract.createdAt || new Date(),
        user: null,
      });

      // 3) Estados de Otrosí asociados (una entrada por otrosí)
      try {
        const Otrosi = require('../models/Otrosi');
        const otrosis = await Otrosi.findAll({
          where: { contractId: contract.id },
          order: [['updatedAt', 'ASC']],
          raw: true,
        });
        for (const o of otrosis) {
          result.push({
            id: `otrosi-${o.id}`,
            action: 'otrosi_status',
            oldStatus: null,
            newStatus: o.estado || null,
            comment: `Otrosí #${o.numeroOtrosi || o.id} - ${statusLabel(o.estado)}`,
            fileId: null,
            timestamp: o.updatedAt || o.createdAt || contract.updatedAt || new Date(),
            user: null,
          });
        }
      } catch (_) {
        // ignorar si no existe el modelo o falla la consulta
      }

      // Orden cronológico ascendente
      result.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


