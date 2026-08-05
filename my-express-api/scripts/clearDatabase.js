#!/usr/bin/env node

/**
 * Database Cleaning Script for Contract Management System
 * 
 * This script provides comprehensive database cleaning functionality with safety features.
 * It can clean all data or specific tables based on command line arguments.
 * After cleaning, it automatically resets identity counters (auto-increment) to start from 1.
 * 
 * Usage:
 *   node scripts/clearDatabase.js                    # Interactive mode with confirmation
 *   node scripts/clearDatabase.js --all              # Clean all data (with confirmation)
 *   node scripts/clearDatabase.js --all --force      # Clean all data without confirmation
 *   node scripts/clearDatabase.js --tables users contracts  # Clean specific tables
 *   node scripts/clearDatabase.js --dry-run          # Show what would be deleted without doing it
 *   node scripts/clearDatabase.js --help             # Show help
 * 
 * Features:
 * - Cleans data in correct order (respecting foreign key constraints)
 * - Resets identity counters (auto-increment) to start from 1 after cleaning
 * - Supports dry-run mode to preview changes
 * - Interactive and command-line modes
 * - Comprehensive error handling and logging
 */

const readline = require('readline');
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

// Define table cleaning order (respecting foreign key constraints)
const CLEANING_ORDER = [
  { name: 'ContractViewer', model: ContractViewer, description: 'Contract Viewers (junction table)' },
  { name: 'ContractHistory', model: ContractHistory, description: 'Contract History' },
  { name: 'ContractFile', model: ContractFile, description: 'Contract Files' },
  { name: 'OtrosiFile', model: OtrosiFile, description: 'Otrosi Files' },
  { name: 'Otrosi', model: Otrosi, description: 'Otrosi (Contract Addendums)' },
  { name: 'Contract', model: Contract, description: 'Contracts' },
  { name: 'RejectedUser', model: RejectedUser, description: 'Rejected Users' },
  { name: 'User', model: User, description: 'Users' }
];

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

class DatabaseCleaner {
  constructor() {
    this.dryRun = false;
    this.force = false;
    this.tablesToClean = [];
    this.stats = {
      totalRecords: 0,
      deletedRecords: 0,
      errors: 0,
      startTime: null,
      endTime: null
    };
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logError(message) {
    this.log(`❌ ERROR: ${message}`, 'red');
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'green');
  }

  logWarning(message) {
    this.log(`⚠️  WARNING: ${message}`, 'yellow');
  }

  logInfo(message) {
    this.log(`ℹ️  ${message}`, 'blue');
  }

  async connect() {
    try {
      await sequelize.authenticate();
      this.logSuccess('Database connection established successfully');
      return true;
    } catch (error) {
      this.logError(`Unable to connect to database: ${error.message}`);
      return false;
    }
  }

  async disconnect() {
    try {
      await sequelize.close();
      this.logSuccess('Database connection closed');
    } catch (error) {
      this.logError(`Error closing database connection: ${error.message}`);
    }
  }

  async getTableStats() {
    this.logInfo('Gathering table statistics...');
    const stats = {};
    
    for (const table of CLEANING_ORDER) {
      try {
        const count = await table.model.count();
        stats[table.name] = count;
        this.stats.totalRecords += count;
        this.log(`  ${table.description}: ${count} records`, 'cyan');
      } catch (error) {
        this.logError(`Error counting ${table.name}: ${error.message}`);
        stats[table.name] = 'Error';
        this.stats.errors++;
      }
    }
    
    return stats;
  }

  async cleanTable(table) {
    const { name, model, description } = table;
    
    try {
      if (this.dryRun) {
        const count = await model.count();
        this.log(`[DRY RUN] Would delete ${count} records from ${description}`, 'yellow');
        return { success: true, deleted: count };
      }

      this.log(`Cleaning ${description}...`, 'blue');
      const count = await model.count();
      
      if (count === 0) {
        this.log(`  No records to delete in ${description}`, 'cyan');
        return { success: true, deleted: 0 };
      }

      // Use truncate for junction tables, DELETE for tables with foreign keys
      if (name === 'ContractViewer') {
        await sequelize.query(`TRUNCATE TABLE contract_viewers`);
      } else if (['Otrosi', 'Contract', 'User'].includes(name)) {
        // Use DELETE for tables with foreign key constraints
        await model.destroy({ where: {} });
      } else {
        // Use truncate for other tables
        await model.destroy({ where: {}, truncate: true });
      }

      this.logSuccess(`  Deleted ${count} records from ${description}`);
      return { success: true, deleted: count };
      
    } catch (error) {
      this.logError(`  Failed to clean ${description}: ${error.message}`);
      this.stats.errors++;
      return { success: false, deleted: 0, error: error.message };
    }
  }

  async resetIdentityCounters() {
    this.logInfo('Resetting identity counters (auto-increment)...');
    
    // Define tables that have identity columns (auto-increment)
    const identityTables = [
      { name: 'contracts', description: 'Contracts' },
      { name: 'users', description: 'Users' },
      { name: 'otrosi', description: 'Otrosi' },
      { name: 'contract_files', description: 'Contract Files' },
      { name: 'otrosi_files', description: 'Otrosi Files' },
      { name: 'contract_history', description: 'Contract History' },
      { name: 'rejected_users', description: 'Rejected Users' }
    ];

    for (const table of identityTables) {
      try {
        if (this.dryRun) {
          this.log(`[DRY RUN] Would reset identity counter for ${table.description}`, 'yellow');
          continue;
        }

        // Reset identity counter to start from 1
        await sequelize.query(`DBCC CHECKIDENT('${table.name}', RESEED, 0)`);
        this.logSuccess(`  Reset identity counter for ${table.description}`);
      } catch (error) {
        // Some tables might not have identity columns, which is fine
        if (error.message.includes('does not have an identity column')) {
          this.log(`  ${table.description} does not have an identity column (skipping)`, 'cyan');
        } else {
          this.logError(`  Failed to reset identity for ${table.description}: ${error.message}`);
          this.stats.errors++;
        }
      }
    }
  }

  async cleanAllTables() {
    this.logInfo('Starting database cleanup...');
    this.stats.startTime = new Date();

    for (const table of CLEANING_ORDER) {
      const result = await this.cleanTable(table);
      if (result.success) {
        this.stats.deletedRecords += result.deleted;
      }
    }

    // Reset identity counters after cleaning
    await this.resetIdentityCounters();

    this.stats.endTime = new Date();
    this.logSummary();
  }

  async cleanSpecificTables(tableNames) {
    this.logInfo(`Cleaning specific tables: ${tableNames.join(', ')}`);
    this.stats.startTime = new Date();

    // Filter tables that exist and are in the cleaning order
    const tablesToClean = CLEANING_ORDER.filter(table => 
      tableNames.includes(table.name.toLowerCase())
    );

    if (tablesToClean.length === 0) {
      this.logError('No valid tables found to clean');
      return;
    }

    // Sort by cleaning order
    for (const table of tablesToClean) {
      const result = await this.cleanTable(table);
      if (result.success) {
        this.stats.deletedRecords += result.deleted;
      }
    }

    // Reset identity counters for cleaned tables
    await this.resetIdentityCounters();

    this.stats.endTime = new Date();
    this.logSummary();
  }

  logSummary() {
    const duration = this.stats.endTime - this.stats.startTime;
    this.log('\n' + '='.repeat(50), 'bold');
    this.log('CLEANUP SUMMARY', 'bold');
    this.log('='.repeat(50), 'bold');
    
    if (this.dryRun) {
      this.log('Mode: DRY RUN (no actual changes made)', 'yellow');
    } else {
      this.log(`Total records deleted: ${this.stats.deletedRecords}`, 'green');
      this.log('Identity counters reset to start from 1', 'green');
    }
    
    this.log(`Total records found: ${this.stats.totalRecords}`, 'cyan');
    this.log(`Errors encountered: ${this.stats.errors}`, this.stats.errors > 0 ? 'red' : 'green');
    this.log(`Duration: ${duration}ms`, 'blue');
    
    if (this.stats.errors > 0) {
      this.logWarning('Some errors occurred during cleanup. Check the logs above.');
    } else if (!this.dryRun) {
      this.logSuccess('Database cleanup completed successfully!');
      this.logSuccess('New records will now start with ID = 1');
    }
    
    this.log('='.repeat(50), 'bold');
  }

  async confirmAction(message) {
    if (this.force) {
      return true;
    }

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
    this.log('\nDatabase Cleaning Script - Help', 'bold');
    this.log('='.repeat(40), 'bold');
    this.log('Usage: node scripts/clearDatabase.js [options]', 'cyan');
    this.log('\nOptions:', 'yellow');
    this.log('  --all              Clean all tables');
    this.log('  --force            Skip confirmation prompts');
    this.log('  --dry-run          Show what would be deleted without doing it');
    this.log('  --tables <names>   Clean specific tables (space-separated)');
    this.log('  --help             Show this help message');
    this.log('\nAvailable tables:', 'yellow');
    CLEANING_ORDER.forEach(table => {
      this.log(`  ${table.name.toLowerCase().padEnd(15)} - ${table.description}`);
    });
    this.log('\nExamples:', 'yellow');
    this.log('  node scripts/clearDatabase.js --all --force');
    this.log('  node scripts/clearDatabase.js --tables users contracts');
    this.log('  node scripts/clearDatabase.js --dry-run');
    this.log('');
  }

  async interactiveMode() {
    this.log('\nDatabase Cleaning Script - Interactive Mode', 'bold');
    this.log('='.repeat(45), 'bold');
    
    // Show current database stats
    const stats = await this.getTableStats();
    
    this.log(`\nTotal records in database: ${this.stats.totalRecords}`, 'cyan');
    
    if (this.stats.totalRecords === 0) {
      this.logInfo('Database is already empty');
      return;
    }

    // Ask what to clean
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const cleanAll = await new Promise((resolve) => {
      rl.question('\nDo you want to clean ALL data? (y/N): ', (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });

    if (cleanAll) {
      rl.close();
      const confirmed = await this.confirmAction(
        `\n⚠️  WARNING: This will delete ALL ${this.stats.totalRecords} records from the database. Are you sure?`
      );
      
      if (confirmed) {
        await this.cleanAllTables();
      } else {
        this.logInfo('Operation cancelled by user');
      }
    } else {
      // Ask for specific tables
      this.log('\nAvailable tables:', 'yellow');
      CLEANING_ORDER.forEach((table, index) => {
        this.log(`  ${index + 1}. ${table.name} - ${table.description} (${stats[table.name]} records)`);
      });

      const tableChoice = await new Promise((resolve) => {
        rl.question('\nEnter table numbers to clean (comma-separated, e.g., 1,3,5): ', (answer) => {
          resolve(answer);
        });
      });

      rl.close();

      if (tableChoice.trim()) {
        const indices = tableChoice.split(',').map(n => parseInt(n.trim()) - 1).filter(n => !isNaN(n) && n >= 0 && n < CLEANING_ORDER.length);
        
        if (indices.length > 0) {
          const selectedTables = indices.map(i => CLEANING_ORDER[i].name);
          const confirmed = await this.confirmAction(
            `\nAre you sure you want to clean these tables: ${selectedTables.join(', ')}?`
          );
          
          if (confirmed) {
            await this.cleanSpecificTables(selectedTables);
          } else {
            this.logInfo('Operation cancelled by user');
          }
        } else {
          this.logError('Invalid table selection');
        }
      } else {
        this.logInfo('No tables selected. Operation cancelled.');
      }
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const cleaner = new DatabaseCleaner();

  // Parse command line arguments
  if (args.includes('--help')) {
    cleaner.showHelp();
    return;
  }

  if (args.includes('--dry-run')) {
    cleaner.dryRun = true;
  }

  if (args.includes('--force')) {
    cleaner.force = true;
  }

  // Connect to database
  const connected = await cleaner.connect();
  if (!connected) {
    process.exit(1);
  }

  try {
    if (args.includes('--all')) {
      if (cleaner.dryRun) {
        await cleaner.getTableStats();
        cleaner.logInfo('Dry run completed. No changes were made.');
      } else {
        const confirmed = await cleaner.confirmAction(
          '⚠️  WARNING: This will delete ALL data from the database. Are you sure?'
        );
        
        if (confirmed) {
          await cleaner.cleanAllTables();
        } else {
          cleaner.logInfo('Operation cancelled by user');
        }
      }
    } else if (args.includes('--tables')) {
      const tableIndex = args.indexOf('--tables');
      const tableNames = args.slice(tableIndex + 1);
      
      if (tableNames.length === 0) {
        cleaner.logError('No table names provided after --tables');
        cleaner.showHelp();
        return;
      }

      await cleaner.cleanSpecificTables(tableNames);
    } else {
      // Interactive mode
      await cleaner.interactiveMode();
    }
  } catch (error) {
    cleaner.logError(`Unexpected error: ${error.message}`);
    process.exit(1);
  } finally {
    await cleaner.disconnect();
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DatabaseCleaner;
