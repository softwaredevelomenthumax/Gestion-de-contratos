const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OtrosiFile = sequelize.define('OtrosiFile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  otrosiId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'otrosi_id',
    references: {
      model: 'otrosi',
      key: 'id'
    }
  },
  contractId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'contract_id',
    references: {
      model: 'contracts',
      key: 'id'
    }
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filepath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Categoría del archivo: Respuesta Usuario, Respuesta Abogado, etc.'
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tipo específico del archivo: Respuesta Usuario, Respuesta Abogado, etc.'
  },
  responseType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tipo de respuesta: lawyer (abogado) o user (usuario)'
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'uploaded_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  uploadedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'uploaded_at',
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'otrosi_files',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ['otrosi_id']
    },
    {
      fields: ['contract_id']
    },
    {
      fields: ['uploaded_by']
    }
  ]
});

// Función estática para determinar el tipo de archivo automáticamente
OtrosiFile.determineFileType = function(userRole, action, category = null, filename = null) {
  // Si es una respuesta
  if (action === 'respond') {
    return userRole === 'lawyer' ? 'Respuesta Abogado' : 'Respuesta Usuario';
  }
  
  // Si es una firma
  if (action === 'sign') {
    return userRole === 'lawyer' ? 'Firma Abogado' : 'Firma Usuario';
  }
  
  // Para archivos subidos directamente
  if (category) {
    return category;
  }
  
  // Fallback basado en el nombre del archivo
  if (filename) {
    const lowerFilename = filename.toLowerCase();
    if (lowerFilename.includes('firma')) {
      return userRole === 'lawyer' ? 'Firma Abogado' : 'Firma Usuario';
    }
    if (lowerFilename.includes('respuesta')) {
      return userRole === 'lawyer' ? 'Respuesta Abogado' : 'Respuesta Usuario';
    }
  }
  
  // Default
  return userRole === 'lawyer' ? 'Archivo Abogado' : 'Archivo Usuario';
};

module.exports = OtrosiFile;
