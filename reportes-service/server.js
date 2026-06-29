require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize } = require('./models');

const reporteRoutes = require('./routes/reporteRoutes');

const app = express();
const PORT = process.env.PORT || 3007;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files para reportes
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Routes
app.use('/api/reportes', reporteRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'reportes-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    console.log('📦 Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`📊 Reportes Service corriendo en http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`  # Reportes`);
      console.log(`  POST   /api/reportes/reportes/ventas-diarias (ADMIN/GERENTE)`);
      console.log(`  POST   /api/reportes/reportes/productos-mas-vendidos (ADMIN/GERENTE)`);
      console.log(`  POST   /api/reportes/reportes/stock-bajo (ADMIN/GERENTE)`);
      console.log(`  POST   /api/reportes/reportes/proximos-vencer (ADMIN/GERENTE)`);
      console.log(`  POST   /api/reportes/reportes/clientes-frecuentes (ADMIN/GERENTE)`);
      console.log(`  GET    /api/reportes/reportes`);
      console.log(`  GET    /api/reportes/reportes/:id`);
      console.log(`  GET    /api/reportes/reportes/:id/descargar`);
      console.log(`  # Alertas`);
      console.log(`  GET    /api/reportes/alertas`);
      console.log(`  PUT    /api/reportes/alertas/:id/leida`);
      console.log(`  PUT    /api/reportes/alertas/:id/resolver (ADMIN/GERENTE)`);
      console.log(`  POST   /api/reportes/alertas (ADMIN/GERENTE)`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar la BD:', error);
    process.exit(1);
  });