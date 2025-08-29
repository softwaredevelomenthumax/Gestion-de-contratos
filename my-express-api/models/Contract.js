const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Contract = sequelize.define('Contract', {
  tipoSolicitud: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'tipo_solicitud'
  },
  tipoContrato: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'tipo_contrato'
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'descripcion'
  },
  area: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'area'
  },
  gerenteArea: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'gerente_area'
  },
  proveedor: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'proveedor'
  },
  nitProveedor: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'nit_proveedor'
  },
  valorSinIVA: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    field: 'valor_sin_i_v_a'
  },
  valorIVA: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: false,
    field: 'valor_i_v_a'
  },
  moneda: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'moneda'
  },
  fechaInicio: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fecha_inicio'
  },
  fechaFinal: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'fecha_final'
  },
  duracion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'duracion'
  },
  estado: {
    type: DataTypes.ENUM(
      'new', 
      'respondido', 
      'para responder', 
      'returned', 
      'signed', 
      'vencido', 
      'seen', 
      'awaiting_user_response', 
      'awaiting_lawyer_review', 
      'awaiting_signature', 
      'signature_otrosi_already_signedByUser',
      'otrosi_awaiting_user_response',
      'otrosi_awaiting_lawyer_review',
      'otrosi_awaiting_signature',
      'otrosi_signed',
      'rechazado',
      'devuelto'
    ),
    defaultValue: 'new',
    field: 'estado'
  },
  lawyerComment: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'lawyer_comment'
  },
  nombreSolicitante: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'nombre_solicitante'
  },
  formaPago: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'forma_pago'
  },
  fechaIngreso: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'fecha_ingreso'
  },
  descripcionOtrosi: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'descripcion_otrosi'
  },
  esOtrosi: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'es_otrosi'
  },
  contratoOriginalId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'contrato_original_id'
  },
  valorOtrosi: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'valor_otrosi'
  },
  ivaOtrosi: {
    type: DataTypes.DECIMAL(20, 2),
    allowNull: true,
    field: 'iva_otrosi'
  },
  monedaOtrosi: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'moneda_otrosi'
  },
}, {
  tableName: 'contracts',
  timestamps: false, // Deshabilitar timestamps
  underscored: false // No usar snake_case
});

const ContractViewer = sequelize.define('ContractViewer', {}, { tableName: 'contract_viewers', timestamps: false });

Contract.addHook('afterFind', (result) => {
  if (Array.isArray(result)) {
    result.forEach(contract => {
      if (contract) {
        contract.dataValues.valorTotal = (
          parseFloat(contract.valorSinIVA || 0) + 
          parseFloat(contract.valorIVA || 0)
        ).toFixed(2);
      }
    });
  } else if (result) {
    result.dataValues.valorTotal = (
      parseFloat(result.valorSinIVA || 0) + 
      parseFloat(result.valorIVA || 0)
    ).toFixed(2);
  }
});

module.exports = { Contract, ContractViewer };