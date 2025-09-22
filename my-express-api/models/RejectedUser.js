const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RejectedUser = sequelize.define('RejectedUser', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name',
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['regular', 'lawyer']]
    }
  },
  rejectedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'rejected_at'
  },
  rejectedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rejected_by'
  }
}, {
  tableName: 'rejected_users',
  timestamps: false,
});

module.exports = RejectedUser;
