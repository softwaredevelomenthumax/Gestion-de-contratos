const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Otrosi = sequelize.define('Otrosi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  numeroOtrosi: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'numero_otrosi',
    comment: 'Sequential number of otrosi for this contract (1, 2, 3, etc.)'
  },
  descripcionCambios: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'descripcion_cambios'
  },
  valorTotal: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'valor_total'
  },
  moneda: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  porcentajeIVA: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    field: 'porcentaje_iva'
  },
  valorIVA: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'valor_iva'
  },
  formaPago: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'forma_pago'
  },
  fechaInicio: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_inicio'
  },
  fechaFinal: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_final'
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pendiente',
    validate: {
      isIn: [[
        'pendiente', 
        'otrosi_awaiting_user_response', 
        'otrosi_awaiting_lawyer_review', 
        'otrosi_awaiting_signature', 
        'otrosi_signed',  
        'devuelto'
      ]]
    }
  },
  cartaSolicitudPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'carta_solicitud_path'
  },
  firmarOtrosiPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'firmar_otrosi_path'
  },
  firmaAbogadoPath: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'firma_abogado_path',
    comment: 'Path to lawyer signature file for this otrosi'
  },
  comentariosAbogado: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'comentarios_abogado'
  },
  fechaCreacion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'fecha_creacion'
  },
  fechaAprobacion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_aprobacion'
  },
  fechaDevolucion: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'fecha_devolucion'
  },
  firmadoPorUsuario: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'firmado_por_usuario'
  }
}, {
  tableName: 'otrosi',
  timestamps: false,
  underscored: false,
  indexes: [
    {
      unique: true,
      fields: ['contract_id', 'numero_otrosi']
    }
  ]
});

module.exports = Otrosi;
