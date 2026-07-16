// inventario-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const logger = require('../logs/logger');

const inventarioRoutes = require('./routes/inventarioRoutes');

const app = express();
const PORT = process.env.PORT || 3004;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/inventario', inventarioRoutes);

// Health check
app.get('/health', (req, res) => {
  logger.info('INVENTARIO-SERVICE', '✅ Health check');
  res.status(200).json({ 
    status: 'OK', 
    service: 'inventario-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    logger.dbSync('INVENTARIO-SERVICE');
    app.listen(PORT, () => {
      console.log(`📦 Inventario Service corriendo en http://localhost:${PORT}`);
      logger.serviceStart('INVENTARIO-SERVICE', PORT);
    });
  })
  .catch(error => {
    logger.error('INVENTARIO-SERVICE', '❌ Error al conectar la BD', { error: error.message });
    process.exit(1);
  });