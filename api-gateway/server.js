const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas peticiones desde esta IP, intente nuevamente más tarde'
});
app.use('/api/', limiter);

// Rutas públicas (sin autenticación)
app.use('/api/auth', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  }
}));

// Rutas protegidas (requieren token)
app.use('/api/usuarios', verifyToken, createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true
}));

// Servir frontend estático
app.use(express.static('../frontend/public'));

// Ruta para el dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile('dashboard.html', { root: '../frontend/public' });
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en http://localhost:${PORT}`);
});