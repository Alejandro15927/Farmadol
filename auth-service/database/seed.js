require('dotenv').config();
const { sequelize, User, Role } = require('../models');
const { hashPassword } = require('../utils/bcrypt');

const ROLES = [
  { nombre: 'ADMIN', descripcion: 'Administrador del sistema' },
  { nombre: 'CAJERO', descripcion: 'Cajero de farmacia' },
  { nombre: 'FARMACEUTICO', descripcion: 'Farmacéutico responsable' }
];

const ADMIN_USER = {
  username: 'admin',
  email: 'admin@farmadol.com',
  password: 'admin123'
};

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Conectado a la base de datos');

    for (const roleData of ROLES) {
      const [role] = await Role.findOrCreate({
        where: { nombre: roleData.nombre },
        defaults: roleData
      });
      console.log(`Rol: ${role.nombre}`);
    }

    const adminRole = await Role.findOne({ where: { nombre: 'ADMIN' } });

    const existingAdmin = await User.findOne({ where: { email: ADMIN_USER.email } });
    if (existingAdmin) {
      console.log('Usuario admin ya existe, omitiendo creación');
    } else {
      const hashedPassword = await hashPassword(ADMIN_USER.password);
      const admin = await User.create({
        username: ADMIN_USER.username,
        email: ADMIN_USER.email,
        password: hashedPassword,
        estado: true
      });
      await admin.addRole(adminRole);
      console.log(`Usuario admin creado: ${ADMIN_USER.email}`);
    }

    console.log('Seed completado');
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
}

seed();
