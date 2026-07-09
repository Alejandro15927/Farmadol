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

// Servir archivos estáticos de reportes
app.use('/reportes_archivos', express.static(path.join(__dirname, 'reportes_archivos')));

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
      console.log(`📁 Archivos de reportes: ${path.join(__dirname, 'reportes_archivos')}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`  # Generación de Reportes (ADMIN/GERENTE)`);
      console.log(`  POST   /api/reportes/generar/ventas`);
      console.log(`  POST   /api/reportes/generar/inventario`);
      console.log(`  POST   /api/reportes/generar/clientes`);
      console.log(`  POST   /api/reportes/generar/compras`);
      console.log(`  POST   /api/reportes/generar/resumen`);
      console.log(`  # Reportes Guardados`);
      console.log(`  GET    /api/reportes`);
      console.log(`  GET    /api/reportes/estadisticas (ADMIN/GERENTE)`);
      console.log(`  GET    /api/reportes/descargar/:id`);
      console.log(`  GET    /api/reportes/:id`);  
      console.log(`  DELETE /api/reportes/:id (ADMIN)`);
      console.log(`  # Alertas`);
      console.log(`  GET    /api/reportes/alertas`);
      console.log(`  GET    /api/reportes/alertas/no-leidas`);
      console.log(`  GET    /api/reportes/alertas/:id`);
      console.log(`  POST   /api/reportes/alertas (ADMIN/GERENTE)`);
      console.log(`  PUT    /api/reportes/alertas/:id/leer (ADMIN/GERENTE)`);
      console.log(`  PUT    /api/reportes/alertas/:id/resolver (ADMIN/GERENTE)`);
      console.log(`  PUT    /api/reportes/alertas/:id/ignorar (ADMIN/GERENTE)`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar la BD:', error);
    process.exit(1);
  });