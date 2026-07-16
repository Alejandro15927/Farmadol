// frontend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('../logs/logger');

const app = express();
const PORT = process.env.PORT || 3010;

// ==================== MIDDLEWARES ====================

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3010'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ARCHIVOS ESTÁTICOS ====================
app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS DE PÁGINAS ====================

app.get('/', (req, res) => {
  logger.info('FRONTEND', '📄 Página Login servida');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  logger.info('FRONTEND', '📄 Página Dashboard servida');
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/sucursales', (req, res) => {
  logger.info('FRONTEND', '📄 Página Sucursales servida');
  res.sendFile(path.join(__dirname, 'public', 'sucursales.html'));
});

app.get('/clientes', (req, res) => {
  logger.info('FRONTEND', '📄 Página Clientes servida');
  res.sendFile(path.join(__dirname, 'public', 'clientes.html'));
});

app.get('/usuarios', (req, res) => {
  logger.info('FRONTEND', '📄 Página Usuarios servida');
  res.sendFile(path.join(__dirname, 'public', 'usuarios.html'));
});

app.get('/inventario', (req, res) => {
  logger.info('FRONTEND', '📄 Página Inventario servida');
  res.sendFile(path.join(__dirname, 'public', 'inventario.html'));
});

app.get('/compras', (req, res) => {
  logger.info('FRONTEND', '📄 Página Compras servida');
  res.sendFile(path.join(__dirname, 'public', 'compras.html'));
});

app.get('/ventas', (req, res) => {
  logger.info('FRONTEND', '📄 Página Ventas servida');
  res.sendFile(path.join(__dirname, 'public', 'ventas.html'));
});

app.get('/reportes', (req, res) => {
  logger.info('FRONTEND', '📄 Página Reportes servida');
  res.sendFile(path.join(__dirname, 'public', 'reportes.html'));
});

app.get('/perfil', (req, res) => {
  logger.info('FRONTEND', '📄 Página Perfil servida');
  res.sendFile(path.join(__dirname, 'public', 'perfil.html'));
});

app.get('/configuracion', (req, res) => {
  logger.info('FRONTEND', '📄 Página Configuración servida');
  res.sendFile(path.join(__dirname, 'public', 'configuracion.html'));
});

// ==================== RUTAS DE API (PROXY) ====================

app.get('/health', (req, res) => {
  logger.info('FRONTEND', '✅ Health check');
  res.status(200).json({
    status: 'OK',
    service: 'farmadol-frontend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      login: '/',
      dashboard: '/dashboard',
      sucursales: '/sucursales',
      clientes: '/clientes',
      usuarios: '/usuarios',
      inventario: '/inventario',
      compras: '/compras',
      ventas: '/ventas',
      reportes: '/reportes'
    }
  });
});

// ==================== MANEJO DE ERRORES 404 ====================

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    logger.warn('FRONTEND', `⚠️ API no encontrada: ${req.path}`);
    return res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado',
      path: req.path
    });
  }
  
  logger.warn('FRONTEND', `⚠️ Página no encontrada: ${req.path}, redirigiendo a login`);
  res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== INICIO DEL SERVIDOR ====================

app.listen(PORT, () => {
  console.log('========================================');
  console.log('🎨 FRONTEND - FARMADOL SOA');
  console.log('========================================');
  console.log(`🌐 Frontend corriendo en: http://localhost:${PORT}`);
  console.log(`🔗 API Gateway: http://localhost:3000`);
  console.log('========================================');
  
  logger.serviceStart('FRONTEND', PORT);
  logger.info('FRONTEND', '🎨 Frontend iniciado correctamente');
});

process.on('SIGTERM', () => {
  logger.info('FRONTEND', '🛑 SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('FRONTEND', '🛑 SIGINT recibido, cerrando servidor...');
  process.exit(0);
});