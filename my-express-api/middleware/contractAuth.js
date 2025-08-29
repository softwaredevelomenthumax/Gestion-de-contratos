const { Contract } = require('../models/Contract');

// Middleware para validar permisos y estados
const validateContractAction = (allowedRoles, allowedStates) => {
  return async (req, res, next) => {
    try {
      const contract = await Contract.findByPk(req.params.id);
      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      // Validar rol
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'No tienes permisos para esta acción' });
      }

      // Validar estado del contrato
      if (!allowedStates.includes(contract.estado)) {
        return res.status(400).json({ 
          error: `Esta acción no está permitida cuando el contrato está en estado: ${contract.estado}` 
        });
      }

      // Validar que el usuario regular solo puede responder a sus propios contratos
      if (req.user.role === 'regular' && contract.solicitanteId !== req.user.id) {
        return res.status(403).json({ error: 'Solo puedes responder a tus propios contratos' });
      }

      req.contract = contract;
      next();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

const getNextStatus = (currentStatus, userRole, action) => {
  const transitions = {
    'new': {
      'lawyer': {
        'respond': 'awaiting_user_response'
      }
    },
    'awaiting_user_response': {
      'regular': {
        'respond': 'awaiting_lawyer_review'
      }
    },
    'awaiting_lawyer_review': {
      'lawyer': {
        'sign': 'awaiting_signature',
        'return': 'awaiting_user_response',
        'respond': 'awaiting_user_response'
      }
    },
    'otrosi_awaiting_lawyer_review': {
      'lawyer': {
        'respond': 'otrosi_awaiting_signature',
        'sign': 'otrosi_awaiting_signature'
      }
    },
    'returned': {
      'regular': {
        'respond': 'awaiting_lawyer_review'
      }
    },
    'otrosi_awaiting_user_response': {
      'regular': {
        'respond': 'otrosi_awaiting_lawyer_review'
      }
    },
    'signature_otrosi_already_signedByUser': {
      'lawyer': {
        'sign': 'signed',
        'return': 'awaiting_user_response'
      }
    },
    'awaiting_signature': {
      'regular': {
        'sign': 'signed',
        'respond': 'signed'
      }
    },
    'otrosi_awaiting_signature': {
      'regular': {
        'sign': 'signed',
        'respond': 'signed'
      }
    }
  };

  const roleTransitions = transitions[currentStatus]?.[userRole];
  
  if (typeof roleTransitions === 'string') {
    return roleTransitions;
  }
  
  if (typeof roleTransitions === 'object' && action) {
    return roleTransitions[action] || null;
  }
  
  return null;
};

module.exports = { validateContractAction, getNextStatus };