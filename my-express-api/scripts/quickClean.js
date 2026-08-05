#!/usr/bin/env node

/**
 * Quick Database Clean Script
 * 
 * A simpler alternative to clearDatabase.js for quick cleaning operations.
 * This script provides basic cleaning functionality without interactive prompts.
 * 
 * Usage:
 *   node scripts/quickClean.js              # Clean all data with confirmation
 *   node scripts/quickClean.js --force      # Clean all data without confirmation
 *   node scripts/quickClean.js --reset      # Reset database to initial state
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const sequelize = require('../config/database');

// Import all models
const { Contract, ContractViewer } = require('../models/Contract');
const User = require('../models/User');
const ContractFile = require('../models/ContractFile');
const ContractHistory = require('../models/ContractHistory');
const Otrosi = require('../models/Otrosi');
const OtrosiFile = require('../models/OtrosiFile');
const RejectedUser = require('../models/RejectedUser');

// Define cleaning order (respecting foreign key constraints)
const CLEANING_ORDER = [
  ContractViewer,
  ContractHistory,
  ContractFile,
  OtrosiFile,
  Otrosi,
  Contract,
  RejectedUser,
  User
];

const TABLE_NAMES = [
  'ContractViewer',
  'ContractHistory', 
  'ContractFile',
  'OtrosiFile',
  'Otrosi',
  'Contract',
  'RejectedUser',
  'User'
];

class QuickCleaner {
  constructor() {
    this.force = false;
    this.reset = false;
  }

  log(message, color = 'white') {
    const colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      bold: '\x1b[1m'
    };
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async connect() {
    try {
      await sequelize.authenticate();
      this.log('✅ Database connected', 'green');
      return true;
    } catch (error) {
      this.log(`❌ Database connection failed: ${error.message}`, 'red');
      return false;
    }
  }

  async disconnect() {
    try {
      await sequelize.close();
      this.log('✅ Database disconnected', 'green');
    } catch (error) {
      this.log(`❌ Error disconnecting: ${error.message}`, 'red');
    }
  }

  async getStats() {
    this.log('\n📊 Current database statistics:', 'cyan');
    let totalRecords = 0;
    
    for (let i = 0; i < CLEANING_ORDER.length; i++) {
      try {
        const count = await CLEANING_ORDER[i].count();
        totalRecords += count;
        this.log(`  ${TABLE_NAMES[i]}: ${count} records`);
      } catch (error) {
        this.log(`  ${TABLE_NAMES[i]}: Error - ${error.message}`, 'red');
      }
    }
    
    this.log(`\nTotal records: ${totalRecords}`, 'bold');
    return totalRecords;
  }

  async cleanAll() {
    this.log('\n🧹 Starting database cleanup...', 'blue');
    const startTime = Date.now();
    let deletedRecords = 0;

    for (let i = 0; i < CLEANING_ORDER.length; i++) {
      try {
        const count = await CLEANING_ORDER[i].count();
        
        if (count > 0) {
          this.log(`Cleaning ${TABLE_NAMES[i]} (${count} records)...`, 'yellow');
          
          // Use truncate for junction tables, DELETE for tables with foreign keys
          if (TABLE_NAMES[i] === 'ContractViewer') {
            await sequelize.query(`TRUNCATE TABLE contract_viewers`);
          } else if (['Otrosi', 'Contract', 'User'].includes(TABLE_NAMES[i])) {
            // Use DELETE for tables with foreign key constraints
            await CLEANING_ORDER[i].destroy({ where: {} });
          } else {
            // Use truncate for other tables
            await CLEANING_ORDER[i].destroy({ where: {}, truncate: true });
          }
          
          deletedRecords += count;
          this.log(`  ✅ Deleted ${count} records`, 'green');
        } else {
          this.log(`  ${TABLE_NAMES[i]}: No records to delete`, 'cyan');
        }
      } catch (error) {
        this.log(`  ❌ Error cleaning ${TABLE_NAMES[i]}: ${error.message}`, 'red');
      }
    }

    const duration = Date.now() - startTime;
    this.log(`\n✅ Cleanup completed!`, 'green');
    this.log(`📈 Deleted ${deletedRecords} records in ${duration}ms`, 'cyan');
  }

  async resetDatabase() {
    this.log('\n🔄 Resetting database to initial state...', 'blue');
    
    // First clean all data
    await this.cleanAll();
    
    // Then create a default admin user
    try {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@company.com',
        password: hashedPassword,
        role: 'admin',
        status: 'approved'
      });
      
      this.log('✅ Default admin user created (admin@company.com / admin123)', 'green');
    } catch (error) {
      this.log(`⚠️  Could not create default admin user: ${error.message}`, 'yellow');
    }
  }

  async confirmAction(message) {
    if (this.force) return true;
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(`${message} (y/N): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  showHelp() {
    this.log('\nQuick Database Clean Script', 'bold');
    this.log('============================', 'bold');
    this.log('Usage: node scripts/quickClean.js [options]', 'cyan');
    this.log('\nOptions:', 'yellow');
    this.log('  --force    Skip confirmation prompts');
    this.log('  --reset    Reset database and create default admin user');
    this.log('  --help     Show this help');
    this.log('\nExamples:', 'yellow');
    this.log('  node scripts/quickClean.js');
    this.log('  node scripts/quickClean.js --force');
    this.log('  node scripts/quickClean.js --reset');
    this.log('');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const cleaner = new QuickCleaner();

  if (args.includes('--help')) {
    cleaner.showHelp();
    return;
  }

  if (args.includes('--force')) {
    cleaner.force = true;
  }

  if (args.includes('--reset')) {
    cleaner.reset = true;
  }

  // Connect to database
  const connected = await cleaner.connect();
  if (!connected) {
    process.exit(1);
  }

  try {
    // Show current stats
    const totalRecords = await cleaner.getStats();
    
    if (totalRecords === 0) {
      cleaner.log('\n✅ Database is already empty', 'green');
      return;
    }

    if (cleaner.reset) {
      const confirmed = await cleaner.confirmAction(
        `\n⚠️  This will delete ALL data and create a default admin user. Continue?`
      );
      
      if (confirmed) {
        await cleaner.resetDatabase();
      } else {
        cleaner.log('Operation cancelled', 'yellow');
      }
    } else {
      const confirmed = await cleaner.confirmAction(
        `\n⚠️  This will delete ALL ${totalRecords} records. Continue?`
      );
      
      if (confirmed) {
        await cleaner.cleanAll();
      } else {
        cleaner.log('Operation cancelled', 'yellow');
      }
    }
  } catch (error) {
    cleaner.log(`❌ Unexpected error: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    await cleaner.disconnect();
  }
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = QuickCleaner;
