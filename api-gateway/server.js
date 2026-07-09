require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== CONFIGURACIÓN DE SEGURIDAD ====================

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Demasiadas solicitudes, por favor intenta más tarde'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// ==================== CORS ====================
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3010',
      'http://127.0.0.1:3010',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (process.env.NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🔒 Origen bloqueado por CORS: ${origin}`);
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-User-Id', 'X-User-Roles', 'X-User-Username'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Service'],
  maxAge: 86400
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ==================== LOGGING ====================
app.use(morgan('combined'));

// ==================== MIDDLEWARE DE AUTENTICACIÓN ====================
app.use('/api', authMiddleware);

// ==================== RUTAS PÚBLICAS ====================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'api-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      auth: process.env.AUTH_SERVICE_URL,
      sucursal: process.env.SUCURSAL_SERVICE_URL,
      cliente: process.env.CLIENTE_SERVICE_URL,
      inventario: process.env.INVENTARIO_SERVICE_URL,
      ventas: process.env.VENTAS_SERVICE_URL,
      compra: process.env.COMPRA_SERVICE_URL,
      reportes: process.env.REPORTES_SERVICE_URL
    }
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API Gateway - Farmadol SOA',
    version: '1.0.0',
    status: 'Operational',
    endpoints: {
      auth: '/api/auth',
      sucursal: '/api/sucursales',
      cliente: '/api/clientes',
      inventario: '/api/inventario',
      ventas: '/api/ventas',
      compra: '/api/compras',
      reportes: '/api/reportes'
    }
  });
});

// ==================== PROXY CONFIGURACIÓN ====================

const createServiceProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    logLevel: 'debug',
    onError: (err, req, res) => {
      console.error(`❌ Error en proxy ${target}:`, err.message);
      res.status(503).json({
        success: false,
        message: 'Servicio no disponible temporalmente',
        error: err.message
      });
    },
    onProxyReq: (proxyReq, req) => {
      console.log(`🔄 Proxy: ${req.method} ${req.originalUrl} -> ${target}${req.path}`);
      if (req.headers.authorization) {
        proxyReq.setHeader('Authorization', req.headers.authorization);
      }
      if (req.user) {
        proxyReq.setHeader('X-User-Id', req.user.id);
        proxyReq.setHeader('X-User-Roles', JSON.stringify(req.user.roles || []));
        proxyReq.setHeader('X-User-Username', req.user.username || '');
      }
    },
    onProxyRes: (proxyRes) => {
      proxyRes.headers['X-Service'] = target;
    }
  });
};

// ==================== SERVICIOS ====================

// Auth Service (puerto 3001)
app.use('/api/auth', createServiceProxy(process.env.AUTH_SERVICE_URL, {
  '^/api/auth': '/api/auth'
}));

// Sucursal Service (puerto 3002)
app.use('/api/sucursales', createServiceProxy(process.env.SUCURSAL_SERVICE_URL, {
  '^/api/sucursales': '/api/sucursales'
}));

// Cliente Service (puerto 3003)
app.use('/api/clientes', createServiceProxy(process.env.CLIENTE_SERVICE_URL, {
  '^/api/clientes': '/api/clientes'
}));

// Inventario Service (puerto 3004)
app.use('/api/inventario', createServiceProxy(process.env.INVENTARIO_SERVICE_URL, {
  '^/api/inventario': '/api/inventario'
}));

// Ventas Service (puerto 3005)
app.use('/api/ventas', createServiceProxy(process.env.VENTAS_SERVICE_URL, {
  '^/api/ventas': '/api/ventas'
}));

// Compra Service (puerto 3006)
app.use('/api/compras', createServiceProxy(process.env.COMPRA_SERVICE_URL, {
  '^/api/compras': '/api/compras'
}));

// Reportes Service (puerto 3007)
app.use('/api/reportes', createServiceProxy(process.env.REPORTES_SERVICE_URL, {
  '^/api/reportes': '/api/reportes'
}));

// ==================== MANEJO DE ERRORES ====================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

app.use((err, req, res, next) => {
  console.error('❌ Error en API Gateway:', err);
  
  if (err.message === 'Origen no permitido por CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origen no permitido por CORS'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==================== INICIO DEL SERVIDOR ====================
app.listen(PORT, () => {
  console.log('========================================');
  console.log('🌉 API GATEWAY - FARMADOL SOA');
  console.log('========================================');
  console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
  console.log('📋 Servicios registrados:');
  console.log(`  🔐 Auth       → ${process.env.AUTH_SERVICE_URL}`);
  console.log(`  🏢 Sucursal   → ${process.env.SUCURSAL_SERVICE_URL}`);
  console.log(`  👤 Cliente    → ${process.env.CLIENTE_SERVICE_URL}`);
  console.log(`  📦 Inventario → ${process.env.INVENTARIO_SERVICE_URL}`);
  console.log(`  💳 Ventas     → ${process.env.VENTAS_SERVICE_URL}`);
  console.log(`  🛒 Compra     → ${process.env.COMPRA_SERVICE_URL}`);
  console.log(`  📊 Reportes   → ${process.env.REPORTES_SERVICE_URL}`);
  console.log('========================================');
  console.log(`🌐 CORS habilitado para frontend en puerto 3010`);
  console.log(`🔒 Rate limiting: 1000 requests/15min`);
  console.log('========================================');
});

process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recibido, cerrando servidor...');
  process.exit(0);
});