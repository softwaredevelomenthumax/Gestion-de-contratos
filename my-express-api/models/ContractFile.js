const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContractFile = sequelize.define('ContractFile', {
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filepath: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true, // e.g., 'Contrato', 'Oferta', 'Respuesta Abogado'
  },
  // Nuevo campo para tipo específico de archivo (sin ENUM para evitar errores)
  fileType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tipo específico del archivo: Contrato, Cámara, Oferta, Respuesta Abogado, Respuesta Usuario, Firma Abogado, Firma Usuario, Contable, Archivo'
  },
  // Campo para identificar quién envió el archivo (sin ENUM para evitar errores)
  responseType: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Tipo de respuesta: lawyer (abogado) o user (usuario)'
  },
  contractId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'contract_id', // Mapear a la columna existente
    references: {
      model: 'contracts',
      key: 'id',
    },
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'ContractFiles',
  timestamps: true,
  underscored: true, // Usar snake_case para timestamps
  createdAt: 'created_at', // Mapear a la columna existente
  updatedAt: 'updated_at', // Mapear a la columna existente
});

// Función estática para determinar el tipo de archivo automáticamente
ContractFile.determineFileType = function(userRole, action, category = null, filename = null) {
  // Si es una firma
  if (action === 'sign') {
    return userRole === 'lawyer' ? 'Firma Abogado' : 'Firma Usuario';
  }
  
  // Si es una respuesta
  if (action === 'respond' || action === 'lawyer_responded' || action === 'user_responded') {
    return userRole === 'lawyer' ? 'Respuesta Abogado' : 'Respuesta Usuario';
  }
  
  // Si es una devolución
  if (action === 'return') {
    return userRole === 'lawyer' ? 'Devolución Abogado' : 'Devolución Usuario';
  }
  
  // Para archivos subidos directamente (no como respuesta)
  if (category) {
    switch (category.toLowerCase()) {
      case 'contrato':
        return 'Contrato';
      case 'camara':
        return 'Cámara';
      case 'oferta':
        return 'Oferta';
      case 'contable':
        return 'Contable';
      default:
        return 'Archivo';
    }
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
  return 'Archivo';
};

module.exports = ContractFile;