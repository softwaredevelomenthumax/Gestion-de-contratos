const User = require('./models/User');
const sequelize = require('./config/database');

(async () => {
  try {
    await sequelize.authenticate();

    const email = 'solicitante@test.com';
    const password = 'solicitante123';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('Usuario ya existe, actualizando datos...');
      await existing.update({
        firstName: 'Usuario',
        lastName: 'Regular',
        role: 'regular',
        status: 'approved',
        countryCode: 'COL',
        preferredLanguage: 'es'
      });
      console.log('Usuario listo:');
      console.log('Email:', email);
      console.log('Contraseña:', password);
      process.exit(0);
    }

    const user = await User.create({
      firstName: 'Usuario',
      lastName: 'Regular',
      email,
      password,
      role: 'regular',
      status: 'approved',
      countryCode: 'COL',
      preferredLanguage: 'es'
    });

    console.log('Usuario creado correctamente:');
    console.log('Email:', email);
    console.log('Contraseña:', password);
    console.log('ID:', user.id);
    process.exit(0);
  } catch (error) {
    console.error('Error creando usuario:', error);
    process.exit(1);
  }
})();
