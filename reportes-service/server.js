// reportes-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');
const logger = require('../logs/logger');

const reporteRoutes = require('./routes/reporteRoutes');

const app = express();
const PORT = process.env.PORT || 3007;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de reportes
app.use('/reportes_archivos', express.static(path.join(__dirname, 'reportes_archivos')));

// Routes
app.use('/api/reportes', reporteRoutes);

// Health check
app.get('/health', (req, res) => {
  logger.info('REPORTES-SERVICE', '✅ Health check');
  res.status(200).json({ 
    status: 'OK', 
    service: 'reportes-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    logger.dbSync('REPORTES-SERVICE');
    app.listen(PORT, () => {
      console.log(`📊 Reportes Service corriendo en http://localhost:${PORT}`);
      logger.serviceStart('REPORTES-SERVICE', PORT);
    });
  })
  .catch(error => {
    logger.error('REPORTES-SERVICE', '❌ Error al conectar la BD', { error: error.message });
    process.exit(1);
  });