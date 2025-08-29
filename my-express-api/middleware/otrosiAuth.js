const { Otrosi } = require('../models/Otrosi');

// Función para obtener el siguiente estado de otrosí basado en la acción y rol
function getNextOtrosiStatus(currentStatus, userRole, action) {
  const transitions = {
    'pendiente': {
      'user': {
        'sign': 'otrosi_awaiting_lawyer_review' // Usuario firma el otrosí
      },
      'lawyer': {
        'approve': 'otrosi_awaiting_signature', // Abogado aprueba y va a firma
        'return': 'otrosi_awaiting_user_response' // Abogado devuelve para cambios
      }
    },
    'otrosi_awaiting_lawyer_review': {
      'lawyer': {
        'approve': 'otrosi_awaiting_signature', // Abogado aprueba y va a firma
        'return': 'otrosi_awaiting_user_response' // Abogado devuelve para cambios
      }
    },
    'otrosi_awaiting_user_response': {
      'user': {
        'respond': 'otrosi_awaiting_lawyer_review' // Usuario responde a devolución
      }
    },
    'otrosi_awaiting_signature': {
      'user': {
        'sign': 'otrosi_signed' // Usuario firma
      },
      'lawyer': {
        'sign': 'otrosi_signed', // Abogado firma (cuando usuario ya firmó)
        'approve': 'otrosi_signed', // Abogado aprueba cuando usuario ya firmó
        'return': 'otrosi_awaiting_user_response' // Abogado puede devolver aún si usuario ya firmó
      }
    }
    // 'otrosi_signed' es el estado final - no necesita aprobación
  };

  const roleTransitions = transitions[currentStatus];
  if (!roleTransitions) return null;

  const userTransitions = roleTransitions[userRole];
  if (!userTransitions) return null;

  return userTransitions[action] || null;
}

// Función para validar si una acción es válida para el estado actual
function validateOtrosiAction(currentStatus, userRole, action) {
  const nextStatus = getNextOtrosiStatus(currentStatus, userRole, action);
  return nextStatus !== null;
}

// Middleware para validar acciones de otrosí
function validateOtrosiActionMiddleware(allowedRoles, allowedStatuses) {
  return (req, res, next) => {
    try {
      const { id } = req.params;
      const { action } = req.body;
      
      // Buscar el otrosí
      Otrosi.findByPk(id).then(otrosi => {
        if (!otrosi) {
          return res.status(404).json({ error: 'Otrosí no encontrado' });
        }

        // Validar rol del usuario
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ 
            error: `Acción no permitida para el rol ${req.user.role}` 
          });
        }

        // Validar estado del otrosí
        if (!allowedStatuses.includes(otrosi.estado)) {
          return res.status(400).json({ 
            error: `Acción no permitida desde el estado ${otrosi.estado}` 
          });
        }

        // Validar transición de estado
        if (action && !validateOtrosiAction(otrosi.estado, req.user.role, action)) {
          return res.status(400).json({ 
            error: `Transición de estado no válida desde ${otrosi.estado} para rol ${req.user.role} con acción ${action}` 
          });
        }

        // Agregar el otrosí al request para uso posterior
        req.otrosi = otrosi;
        next();
      }).catch(error => {
        console.error('Error validando otrosí:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
      });
    } catch (error) {
      console.error('Error en middleware de otrosí:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}

module.exports = {
  getNextOtrosiStatus,
  validateOtrosiAction,
  validateOtrosiActionMiddleware
};
