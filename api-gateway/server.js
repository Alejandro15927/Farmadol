// api-gateway/server.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 3000;

// URLs de los microservicios
const AUTH_URL = 'http://localhost:3001';
const SUCURSAL_URL = 'http://localhost:3002';
const COMPRA_URL = 'http://localhost:3003';
const INVENTARIO_URL = 'http://localhost:3004';
const VENTAS_URL = 'http://localhost:3005';
const CLIENTE_URL = 'http://localhost:3006';
const REPORTES_URL = 'http://localhost:3007';

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ PROXIES PARA TODOS LOS MICROSERVICIOS ============

// 1. Auth Service (público)
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/api/auth' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Auth: ${req.method} ${req.url}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError: (err, req, res) => {
    console.error('❌ Auth Error:', err.message);
    res.status(503).json({ success: false, message: 'Auth Service no disponible' });
  }
}));

// 2. Sucursal Service
app.use('/api/sucursales', createProxyMiddleware({
  target: SUCURSAL_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/sucursales': '/api/sucursales' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Sucursal: ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Sucursal Error:', err.message);
    res.status(503).json({ success: false, message: 'Sucursal Service no disponible' });
  }
}));

// 3. Compra Service
app.use('/api/compras', createProxyMiddleware({
  target: COMPRA_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/compras': '/api/compras' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Compra: ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Compra Error:', err.message);
    res.status(503).json({ success: false, message: 'Compra Service no disponible' });
  }
}));

// 4. Inventario Service
app.use('/api/inventario', createProxyMiddleware({
  target: INVENTARIO_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/inventario': '/api/inventario' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Inventario: ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Inventario Error:', err.message);
    res.status(503).json({ success: false, message: 'Inventario Service no disponible' });
  }
}));

// 5. Ventas Service
app.use('/api/ventas', createProxyMiddleware({
  target: VENTAS_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/ventas': '/api/ventas' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Ventas: ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Ventas Error:', err.message);
    res.status(503).json({ success: false, message: 'Ventas Service no disponible' });
  }
}));

// 6. Cliente Service
app.use('/api/clientes', createProxyMiddleware({
  target: CLIENTE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/clientes': '/api/clientes' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Cliente: ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Cliente Error:', err.message);
    res.status(503).json({ success: false, message: 'Cliente Service no disponible' });
  }
}));

// 7. Reportes Service
app.use('/api/reportes', createProxyMiddleware({
  target: REPORTES_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/reportes': '/api/reportes' },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Reportes: ${req.method} ${req.url}`);
  },
  onError: (err, req, res) => {
    console.error('❌ Reportes Error:', err.message);
    res.status(503).json({ success: false, message: 'Reportes Service no disponible' });
  }
}));

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'api-gateway',
    timestamp: new Date().toISOString()
  });
});

// ============ INICIAR ============
app.listen(PORT, () => {
  console.log(`🚀 API Gateway en http://localhost:${PORT}`);
  console.log(`📋 Proxies configurados:`);
  console.log(`  🔐 Auth: http://localhost:${PORT}/api/auth → ${AUTH_URL}/api/auth`);
  console.log(`  🏢 Sucursal: http://localhost:${PORT}/api/sucursales → ${SUCURSAL_URL}/api/sucursales`);
  console.log(`  🛒 Compra: http://localhost:${PORT}/api/compras → ${COMPRA_URL}/api/compras`);
  console.log(`  📦 Inventario: http://localhost:${PORT}/api/inventario → ${INVENTARIO_URL}/api/inventario`);
  console.log(`  💳 Ventas: http://localhost:${PORT}/api/ventas → ${VENTAS_URL}/api/ventas`);
  console.log(`  👤 Cliente: http://localhost:${PORT}/api/clientes → ${CLIENTE_URL}/api/clientes`);
  console.log(`  📊 Reportes: http://localhost:${PORT}/api/reportes → ${REPORTES_URL}/api/reportes`);
});