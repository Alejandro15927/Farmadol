require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

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
  res.status(200).json({ 
    status: 'OK', 
    service: 'inventario-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    console.log('📦 Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`📦 Inventario Service corriendo en http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`  # Categorías`);
      console.log(`  GET    /api/inventario/categorias`);
      console.log(`  POST   /api/inventario/categorias (ADMIN/GERENTE)`);
      console.log(`  # Productos`);
      console.log(`  GET    /api/inventario/productos`);
      console.log(`  GET    /api/inventario/productos/:id`);
      console.log(`  POST   /api/inventario/productos (ADMIN/GERENTE)`);
      console.log(`  PUT    /api/inventario/productos/:id (ADMIN/GERENTE)`);
      console.log(`  # Stock`);
      console.log(`  GET    /api/inventario/stock`);
      console.log(`  GET    /api/inventario/stock/producto/:producto_id`);
      console.log(`  POST   /api/inventario/entrada (ADMIN/GERENTE/ALMACENERO)`);
      console.log(`  POST   /api/inventario/salida (ADMIN/GERENTE/CAJERO)`);
      console.log(`  POST   /api/inventario/reservar (ADMIN/GERENTE/CAJERO)`);
      console.log(`  POST   /api/inventario/liberar-reserva (ADMIN/GERENTE/CAJERO)`);
      console.log(`  POST   /api/inventario/transferir (ADMIN/GERENTE)`);
      console.log(`  # Consultas`);
      console.log(`  GET    /api/inventario/proximos-vencer`);
      console.log(`  GET    /api/inventario/stock-bajo`);
      console.log(`  GET    /api/inventario/movimientos`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar la BD:', error);
    process.exit(1);
  });