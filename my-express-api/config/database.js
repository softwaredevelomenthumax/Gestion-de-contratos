const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'mssql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) ,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  logging: console.log, // Enable SQL query logging with proper function
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: false
  },
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
      enableArithAbort: true,
      instanceName: '', // Add if using named instance
      connectTimeout: 30000,
      requestTimeout: 30000
    }
  }
});

module.exports = sequelize;