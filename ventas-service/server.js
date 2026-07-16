// ventas-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const logger = require('../logs/logger');

const ventaRoutes = require('./routes/ventaRoutes');

const app = express();
const PORT = process.env.PORT || 3005;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/ventas', ventaRoutes);

// Health check
app.get('/health', (req, res) => {
  logger.info('VENTAS-SERVICE', '✅ Health check');
  res.status(200).json({ 
    status: 'OK', 
    service: 'ventas-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    logger.dbSync('VENTAS-SERVICE');
    app.listen(PORT, () => {
      console.log(`💳 Ventas Service corriendo en http://localhost:${PORT}`);
      logger.serviceStart('VENTAS-SERVICE', PORT);
    });
  })
  .catch(error => {
    logger.error('VENTAS-SERVICE', '❌ Error al conectar la BD', { error: error.message });
    process.exit(1);
  });