/*
  Clear all data from the database while preserving tables and constraints.
  - Disables all FK constraints
  - Deletes all rows from user tables
  - Reseeds identity columns to 0
  - Re-enables constraints with check

  Usage:
    npm run db:clear

  WARNING: This is destructive. It will remove ALL DATA in the configured database.
*/

require('dotenv').config({ path: __dirname + '/../.env' });

const sequelize = require('../config/database');

async function clearDatabase() {
  console.log('⚠️  WARNING: This will DELETE ALL DATA from the database:', process.env.DB_NAME || '(DB_NAME not set)');

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // 1) Disable all constraints
    console.log('⏸️  Disabling all constraints...');
    await sequelize.query(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      SELECT @sql = @sql + N'ALTER TABLE '
        + QUOTENAME(SCHEMA_NAME(t.schema_id)) + N'.' + QUOTENAME(t.name)
        + N' NOCHECK CONSTRAINT ALL; '
      FROM sys.tables AS t;
      EXEC sp_executesql @sql;
    `);

    // 2) Build and execute delete statements for all user tables
    console.log('🧹 Deleting data from all tables...');
    const [tables] = await sequelize.query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name
      FROM sys.tables t
      JOIN sys.schemas s ON s.schema_id = t.schema_id
      WHERE t.is_ms_shipped = 0
      ORDER BY s.name, t.name;
    `);

    for (const row of tables) {
      const schemaName = row.schema_name || row.SCHEMA_NAME;
      const tableName = row.table_name || row.TABLE_NAME;
      if (!schemaName || !tableName) continue;
      const bracketed = `[${schemaName}].[${tableName}]`;
      console.log('   - DELETE FROM', bracketed);
      await sequelize.query(`DELETE FROM ${bracketed};`);
    }

    // 3) Reseed identity columns back to 0
    console.log('🔁 Reseeding identity columns...');
    const [identityTables] = await sequelize.query(`
      SELECT 
        s.name AS schema_name,
        t.name AS table_name
      FROM sys.tables t
      JOIN sys.schemas s ON s.schema_id = t.schema_id
      WHERE EXISTS (
        SELECT 1 FROM sys.columns c
        WHERE c.object_id = t.object_id AND c.is_identity = 1
      );
    `);

    for (const row of identityTables) {
      const schemaName = row.schema_name || row.SCHEMA_NAME;
      const tableName = row.table_name || row.TABLE_NAME;
      if (!schemaName || !tableName) continue;
      const identifier = `${schemaName}.${tableName}`; // no brackets for DBCC
      console.log('   - Reseed', identifier);
      try {
        await sequelize.query(`DBCC CHECKIDENT ('${identifier}', RESEED, 0);`);
      } catch (e) {
        console.warn('     ⚠️  Reseed skipped for', identifier, '-', e.message);
      }
    }

    // 4) Re-enable constraints with check
    console.log('▶️  Re-enabling constraints...');
    await sequelize.query(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      SELECT @sql = @sql + N'ALTER TABLE '
        + QUOTENAME(SCHEMA_NAME(t.schema_id)) + N'.' + QUOTENAME(t.name)
        + N' WITH CHECK CHECK CONSTRAINT ALL; '
      FROM sys.tables AS t;
      EXEC sp_executesql @sql;
    `);

    console.log('🎉 Database cleared successfully (tables preserved).');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing database:', err.message);
    process.exit(1);
  } finally {
    await sequelize.close().catch(() => {});
  }
}

clearDatabase();


