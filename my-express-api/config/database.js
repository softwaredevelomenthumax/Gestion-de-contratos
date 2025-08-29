const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'contract_app',
  logging: true, // Enable SQL query logging
  define: {
    timestamps: true,
    underscored: false
  },
  dialectOptions: {
    // Enable array support
    array: true
  }
});

module.exports = sequelize;