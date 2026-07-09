require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    console.log('📦 Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`🔐 Auth Service corriendo en http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`  # Autenticación (Público)`);
      console.log(`  POST   /api/auth/login`);
      console.log(`  # Autenticación (Protegido)`);
      console.log(`  POST   /api/auth/logout`);
      console.log(`  GET    /api/auth/verify`);
      console.log(`  # Usuarios (ADMIN)`);
      console.log(`  GET    /api/auth/usuarios`);
      console.log(`  GET    /api/auth/usuarios/:id`);
      console.log(`  POST   /api/auth/usuarios`);
      console.log(`  PUT    /api/auth/usuarios/:id`);
      console.log(`  DELETE /api/auth/usuarios/:id`);
      console.log(`  PUT    /api/auth/usuarios/:id/enable`);
      console.log(`  # Roles (ADMIN)`);
      console.log(`  GET    /api/auth/roles`);
      console.log(`  POST   /api/auth/roles`);
      console.log(`  PUT    /api/auth/roles/:id`);
      console.log(`  DELETE /api/auth/roles/:id`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar la BD:', error);
    process.exit(1);
  });