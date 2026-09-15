const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const sequelize = require('../config/database');

const updateDescriptionColumn = async () => {
  try {
    await sequelize.authenticate();

    await sequelize.query(`
      ALTER TABLE dbo.contracts
      ALTER COLUMN descripcion NVARCHAR(MAX) NOT NULL;

      ALTER TABLE dbo.contracts
      ALTER COLUMN forma_pago NVARCHAR(MAX) NOT NULL;
    `);

    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'dbo'
        AND TABLE_NAME = 'contracts'
        AND COLUMN_NAME IN ('descripcion', 'forma_pago');
    `);

    console.log('Las columnas contracts.descripcion y contracts.forma_pago fueron actualizadas a NVARCHAR(MAX).');
    console.table(columns);
  } catch (error) {
    console.error('No fue posible actualizar contracts.descripcion:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

updateDescriptionColumn();
