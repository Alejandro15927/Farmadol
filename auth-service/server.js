// auth-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CAMBIO AQUÍ - Montar en ambos prefijos
app.use('/auth', authRoutes);        // Para el Gateway (http://localhost:3001/auth/login)
app.use('/api/auth', authRoutes);    // Para pruebas directas (http://localhost:3001/api/auth/login)

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Iniciar
sequelize.sync()
  .then(() => {
    console.log(`🔐 Auth Service en http://localhost:${PORT}`);
    console.log(`📋 Endpoints disponibles:`);
    console.log(`  POST /auth/login (para Gateway)`);
    console.log(`  POST /auth/register`);
    console.log(`  POST /auth/verify`);
    console.log(`  GET  /auth/profile`);
    console.log(`  POST /api/auth/login (para pruebas directas)`);
    app.listen(PORT);
  })
  .catch(err => {
    console.error('❌ Error DB:', err);
    process.exit(1);
  });