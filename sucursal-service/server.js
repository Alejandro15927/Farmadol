// sucursal-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const logger = require('../logs/logger');

const sucursalRoutes = require('./routes/sucursalRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/sucursales', sucursalRoutes);

// Health check
app.get('/health', (req, res) => {
  logger.info('SUCURSAL-SERVICE', '✅ Health check');
  res.status(200).json({ 
    status: 'OK', 
    service: 'sucursal-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    logger.dbSync('SUCURSAL-SERVICE');
    app.listen(PORT, () => {
      console.log(`🏢 Sucursal Service corriendo en http://localhost:${PORT}`);
      logger.serviceStart('SUCURSAL-SERVICE', PORT);
    });
  })
  .catch(error => {
    logger.error('SUCURSAL-SERVICE', '❌ Error al conectar la BD', { error: error.message });
    process.exit(1);
  });