// auth-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const logger = require('../logs/logger');

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
  logger.info('AUTH-SERVICE', '✅ Health check');
  res.status(200).json({ 
    status: 'OK', 
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    logger.dbSync('AUTH-SERVICE');
    app.listen(PORT, () => {
      console.log(`🔐 Auth Service corriendo en http://localhost:${PORT}`);
      logger.serviceStart('AUTH-SERVICE', PORT);
    });
  })
  .catch(error => {
    logger.error('AUTH-SERVICE', '❌ Error al conectar la BD', { error: error.message });
    process.exit(1);
  });