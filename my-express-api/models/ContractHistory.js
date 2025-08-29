const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContractHistory = sequelize.define('ContractHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  contractId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'contract_id', // Mapear a la columna existente
    references: {
      model: 'contracts',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id', // Mapear a la columna existente
    references: {
      model: 'users',
      key: 'id',
    },
    onDelete: 'SET NULL',
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  oldStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'old_status', // Mapear a la columna existente
  },
  newStatus: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'new_status', // Mapear a la columna existente
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fileId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_id', // Mapear a la columna existente
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'contract_history',
  timestamps: false,
  underscored: true, // Usar snake_case para todas las columnas
});

module.exports = ContractHistory; 