// compra-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const logger = require('../logs/logger');

const compraRoutes = require('./routes/compraRoutes');

const app = express();
const PORT = process.env.PORT || 3006;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/compras', compraRoutes);

// Health check
app.get('/health', (req, res) => {
  logger.info('COMPRA-SERVICE', '✅ Health check');
  res.status(200).json({ 
    status: 'OK', 
    service: 'compra-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    logger.dbSync('COMPRA-SERVICE');
    app.listen(PORT, () => {
      console.log(`📦 Compra Service corriendo en http://localhost:${PORT}`);
      logger.serviceStart('COMPRA-SERVICE', PORT);
    });
  })
  .catch(error => {
    logger.error('COMPRA-SERVICE', '❌ Error al conectar la BD', { error: error.message });
    process.exit(1);
  });