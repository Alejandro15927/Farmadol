require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

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
  res.status(200).json({ 
    status: 'OK', 
    service: 'ventas-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    console.log('📦 Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`💳 Ventas Service corriendo en http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`  # Clientes (Proxy a cliente-service)`);
      console.log(`  GET    /api/ventas/clientes`);
      console.log(`  GET    /api/ventas/clientes/documento/:documento`);
      console.log(`  GET    /api/ventas/clientes/:id`);
      console.log(`  POST   /api/ventas/clientes (ADMIN/GERENTE/CAJERO)`);
      console.log(`  # Métodos de Pago`);
      console.log(`  GET    /api/ventas/metodos-pago`);
      console.log(`  POST   /api/ventas/metodos-pago (ADMIN)`);
      console.log(`  PUT    /api/ventas/metodos-pago/:id (ADMIN)`);
      console.log(`  DELETE /api/ventas/metodos-pago/:id (ADMIN)`);
      console.log(`  # Ventas`);
      console.log(`  POST   /api/ventas/ventas (ADMIN/GERENTE/CAJERO)`);
      console.log(`  GET    /api/ventas/ventas`);
      console.log(`  GET    /api/ventas/ventas/dia/resumen`);
      console.log(`  GET    /api/ventas/ventas/top/productos`);
      console.log(`  GET    /api/ventas/ventas/estadisticas (ADMIN/GERENTE)`);
      console.log(`  GET    /api/ventas/ventas/cliente/:cliente_id`);
      console.log(`  GET    /api/ventas/ventas/:id`);
      console.log(`  PUT    /api/ventas/ventas/:id/anular (ADMIN/GERENTE)`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar la BD:', error);
    process.exit(1);
  });