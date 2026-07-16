// cliente-service/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const logger = require('../logs/logger');

const clienteRoutes = require('./routes/clienteRoutes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/clientes', clienteRoutes);

// Health check
app.get('/health', (req, res) => {
  logger.info('CLIENTE-SERVICE', '✅ Health check');
  res.status(200).json({ 
    status: 'OK', 
    service: 'cliente-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    logger.dbSync('CLIENTE-SERVICE');
    app.listen(PORT, () => {
      console.log(`👤 Cliente Service corriendo en http://localhost:${PORT}`);
      logger.serviceStart('CLIENTE-SERVICE', PORT);
    });
  })
  .catch(error => {
    logger.error('CLIENTE-SERVICE', '❌ Error al conectar la BD', { error: error.message });
    process.exit(1);
  });