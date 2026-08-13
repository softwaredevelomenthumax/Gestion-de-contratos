const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const { normalizeCountryCode } = require('../utils/countries');

const User = sequelize.define('User', {
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'first_name', // Mapear a la columna existente
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'last_name', // Mapear a la columna existente
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'regular',
    validate: {
      isIn: [['regular', 'lawyer', 'admin']]
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'approved', 'rejected']]
    }
  },
  countryCode: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'CO',
    field: 'country_code',
    validate: {
      isIn: [['CO', 'US', 'MX', 'AR', 'PE', 'CL', 'EC', 'COL', 'USA', 'MEX', 'ARG', 'PER', 'CHL', 'ECU']]
    },
    get() {
      return normalizeCountryCode(this.getDataValue('countryCode')) || this.getDataValue('countryCode');
    }
  },
  preferredLanguage: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'es',
    field: 'preferred_language',
    validate: {
      isIn: [['es', 'en']]
    }
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'avatar'
  }
}, {
  tableName: 'users',
  timestamps: false,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
  },
});

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = User;
