require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const FRONTEND_PATH = path.join(__dirname, '../frontend/public');

// Middlewares globales
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Demasiadas peticiones desde esta IP, intente nuevamente más tarde'
});
app.use('/api/', limiter);

// Proxy de auth antes del body parser para reenviar el stream sin consumirlo
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  on: {
    proxyReq: fixRequestBody
  }
}));

app.use(express.json());

// Rutas protegidas (requieren token)
app.use('/api/usuarios', verifyToken, createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  on: {
    proxyReq: fixRequestBody
  }
}));

// Ruta raíz → login
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: FRONTEND_PATH });
});

// Servir frontend estático
app.use(express.static(FRONTEND_PATH));

// Ruta para el dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile('dashboard.html', { root: FRONTEND_PATH });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en http://localhost:${PORT}`);
});
