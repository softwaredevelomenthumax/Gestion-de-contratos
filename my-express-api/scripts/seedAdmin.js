require('dotenv').config({ path: __dirname + '/../.env' });
const sequelize = require('../config/database');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    console.log('🌱 Starting admin user seeding...');
    
    // Check if an admin user already exists
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create default admin user
    const adminUser = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: 'admin123', // This will be hashed automatically
      role: 'admin',
      status: 'approved'
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await sequelize.close();
  }
};

// Run the seed function if this file is executed directly
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connection established.');
      return seedAdmin();
    })
    .catch(err => {
      console.error('❌ Unable to connect to the database:', err);
    });
}

module.exports = seedAdmin;
