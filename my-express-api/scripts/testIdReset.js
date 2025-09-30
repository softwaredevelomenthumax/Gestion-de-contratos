#!/usr/bin/env node

/**
 * Test script to verify that ID reset functionality works correctly
 * This script creates a test contract, cleans the database, and verifies the next ID starts from 1
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const sequelize = require('../config/database');
const { Contract } = require('../models/Contract');
const User = require('../models/User');
const DatabaseCleaner = require('./clearDatabase');

async function testIdReset() {
  console.log('🧪 Testing ID Reset Functionality\n');
  
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Create a test user first
    const testUser = await User.create({
      nombre: 'Test User',
      email: 'test@example.com',
      password: 'testpassword',
      role: 'user'
    });
    console.log(`✅ Created test user with ID: ${testUser.id}`);

    // Create a test contract
    const testContract = await Contract.create({
      solicitanteId: testUser.id,
      nombreSolicitante: 'Test User',
      emailSolicitante: 'test@example.com',
      telefonoSolicitante: '123456789',
      nombreEmpresa: 'Test Company',
      nitEmpresa: '123456789',
      direccionEmpresa: 'Test Address',
      ciudadEmpresa: 'Test City',
      departamentoEmpresa: 'Test Department',
      paisEmpresa: 'Test Country',
      tipoContrato: 'Servicios',
      descripcionServicio: 'Test service description',
      valorContrato: 1000000,
      moneda: 'COP',
      fechaInicio: new Date(),
      fechaFinal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      estado: 'pendiente'
    });
    console.log(`✅ Created test contract with ID: ${testContract.id}`);

    // Show current state
    const contractCount = await Contract.count();
    const userCount = await User.count();
    console.log(`\n📊 Current state - Contracts: ${contractCount}, Users: ${userCount}`);

    // Clean the database
    console.log('\n🧹 Cleaning database...');
    const cleaner = new DatabaseCleaner();
    cleaner.force = true; // Skip confirmation
    await cleaner.cleanAllTables();

    // Verify the reset
    console.log('\n🔍 Verifying ID reset...');
    
    // Create a new test user
    const newTestUser = await User.create({
      nombre: 'New Test User',
      email: 'newtest@example.com',
      password: 'testpassword',
      role: 'user'
    });
    console.log(`✅ Created new test user with ID: ${newTestUser.id}`);

    // Create a new test contract
    const newTestContract = await Contract.create({
      solicitanteId: newTestUser.id,
      nombreSolicitante: 'New Test User',
      emailSolicitante: 'newtest@example.com',
      telefonoSolicitante: '987654321',
      nombreEmpresa: 'New Test Company',
      nitEmpresa: '987654321',
      direccionEmpresa: 'New Test Address',
      ciudadEmpresa: 'New Test City',
      departamentoEmpresa: 'New Test Department',
      paisEmpresa: 'New Test Country',
      tipoContrato: 'Servicios',
      descripcionServicio: 'New test service description',
      valorContrato: 2000000,
      moneda: 'COP',
      fechaInicio: new Date(),
      fechaFinal: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      estado: 'pendiente'
    });
    console.log(`✅ Created new test contract with ID: ${newTestContract.id}`);

    // Verify IDs start from 1
    if (newTestUser.id === 1 && newTestContract.id === 1) {
      console.log('\n🎉 SUCCESS: ID reset functionality is working correctly!');
      console.log('   - New user ID starts from 1');
      console.log('   - New contract ID starts from 1');
    } else {
      console.log('\n❌ FAILURE: ID reset functionality is not working correctly!');
      console.log(`   - New user ID: ${newTestUser.id} (expected: 1)`);
      console.log(`   - New contract ID: ${newTestContract.id} (expected: 1)`);
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Contract.destroy({ where: {} });
    await User.destroy({ where: {} });
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    console.log('✅ Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testIdReset().catch(console.error);
}

module.exports = testIdReset;
