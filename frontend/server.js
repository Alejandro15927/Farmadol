// frontend/server.js (COMPLETO)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3010;

// Middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'public')));

// Ruta principal - servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ✅ RUTA SUCURSALES - AGREGAR ESTO
app.get('/sucursales', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sucursales.html'));
});

// frontend/server.js
app.get('/clientes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'clientes.html'));
});

// frontend/server.js
app.get('/usuarios', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'usuarios.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'farmadol-frontend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🎨 FRONTEND - FARMADOL');
  console.log('========================================');
  console.log(`🌐 Frontend corriendo en: http://localhost:${PORT}`);
  console.log(`🔗 API Gateway: http://localhost:3000`);
  console.log(`📄 Login: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🏢 Sucursales: http://localhost:${PORT}/sucursales`); // ✅ NUEVO
  console.log('========================================');
});