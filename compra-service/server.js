require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

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
  res.status(200).json({ 
    status: 'OK', 
    service: 'compra-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    console.log('📦 Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`📦 Compra Service corriendo en http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`  # Proveedores (Protegido)`);
      console.log(`  GET    /api/compras/proveedores`);
      console.log(`  GET    /api/compras/proveedores/activos`);
      console.log(`  GET    /api/compras/proveedores/:id`);
      console.log(`  POST   /api/compras/proveedores (ADMIN/GERENTE)`);
      console.log(`  PUT    /api/compras/proveedores/:id (ADMIN/GERENTE)`);
      console.log(`  DELETE /api/compras/proveedores/:id (ADMIN/GERENTE)`);
      console.log(`  PUT    /api/compras/proveedores/:id/enable (ADMIN/GERENTE)`);
      console.log(`  # Compras`);
      console.log(`  POST   /api/compras (ADMIN/GERENTE/ALMACENERO)`);
      console.log(`  GET    /api/compras`);
      console.log(`  GET    /api/compras/dia/resumen`);
      console.log(`  GET    /api/compras/proveedor/:proveedor_id`);
      console.log(`  GET    /api/compras/estadisticas (ADMIN/GERENTE)`);
      console.log(`  GET    /api/compras/:id`);
      console.log(`  PUT    /api/compras/:id (ADMIN/GERENTE)`);
      console.log(`  PUT    /api/compras/:id/anular (ADMIN/GERENTE)`);
      console.log(`  PUT    /api/compras/:id/confirmar (ADMIN/GERENTE/ALMACENERO)`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar la BD:', error);
    process.exit(1);
  });