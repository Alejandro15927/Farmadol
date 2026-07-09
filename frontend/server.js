// frontend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3010;

// ==================== MIDDLEWARES ====================

// CORS configurado para permitir el API Gateway
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3010'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== ARCHIVOS ESTÁTICOS ====================

// Servir archivos estáticos del frontend (CSS, JS, imágenes)
app.use(express.static(path.join(__dirname, 'public')));

// ==================== RUTAS DE PÁGINAS ====================

// Página principal - Login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Sucursales
app.get('/sucursales', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sucursales.html'));
});

// Clientes
app.get('/clientes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'clientes.html'));
});

// Usuarios
app.get('/usuarios', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'usuarios.html'));
});

// Inventario
app.get('/inventario', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inventario.html'));
});

// Compras
app.get('/compras', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'compras.html'));
});

// Ventas
app.get('/ventas', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ventas.html'));
});

// Reportes
app.get('/reportes', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reportes.html'));
});

// Perfil (opcional)
app.get('/perfil', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'perfil.html'));
});

// Configuración (opcional)
app.get('/configuracion', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'configuracion.html'));
});

// ==================== RUTAS DE API (PROXY) ====================

// Health check del frontend
app.get('/health', (req, res) => {
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

// Capturar rutas no encontradas y redirigir al login
app.use((req, res) => {
  // Si es una solicitud de API, devolver JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Endpoint no encontrado',
      path: req.path
    });
  }
  
  // Si es una página HTML, redirigir al login
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
  console.log('📄 Páginas disponibles:');
  console.log(`   🔐 Login      → http://localhost:${PORT}/`);
  console.log(`   📊 Dashboard  → http://localhost:${PORT}/dashboard`);
  console.log(`   🏢 Sucursales → http://localhost:${PORT}/sucursales`);
  console.log(`   👤 Clientes   → http://localhost:${PORT}/clientes`);
  console.log(`   👥 Usuarios   → http://localhost:${PORT}/usuarios`);
  console.log(`   📦 Inventario → http://localhost:${PORT}/inventario`);
  console.log(`   🛒 Compras    → http://localhost:${PORT}/compras`);
  console.log(`   💳 Ventas     → http://localhost:${PORT}/ventas`);
  console.log(`   📊 Reportes   → http://localhost:${PORT}/reportes`);
  console.log('========================================');
  console.log(`🟢 Servidor listo en el puerto ${PORT}`);
  console.log('========================================');
});

// ==================== MANEJO DE CIERRE ====================

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});