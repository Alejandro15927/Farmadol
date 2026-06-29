require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const clienteRoutes = require('./routes/clienteRoutes');

const app = express();
const PORT = process.env.PORT || 3006;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/clientes', clienteRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'cliente-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    console.log('📦 Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`👤 Cliente Service corriendo en http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`  # Clientes`);
      console.log(`  GET    /api/clientes/clientes`);
      console.log(`  GET    /api/clientes/clientes/buscar?numero_documento=...`);
      console.log(`  GET    /api/clientes/clientes/estadisticas (ADMIN/GERENTE)`);
      console.log(`  GET    /api/clientes/clientes/frecuentes (ADMIN/GERENTE)`);
      console.log(`  GET    /api/clientes/clientes/:id`);
      console.log(`  POST   /api/clientes/clientes (ADMIN/GERENTE/CAJERO)`);
      console.log(`  PUT    /api/clientes/clientes/:id (ADMIN/GERENTE/CAJERO)`);
      console.log(`  DELETE /api/clientes/clientes/:id (ADMIN/GERENTE)`);
      console.log(`  # Direcciones`);
      console.log(`  GET    /api/clientes/clientes/:cliente_id/direcciones`);
      console.log(`  POST   /api/clientes/clientes/:cliente_id/direcciones`);
      console.log(`  # Historial`);
      console.log(`  GET    /api/clientes/clientes/:cliente_id/historial`);
      console.log(`  POST   /api/clientes/clientes/:cliente_id/historial`);
      console.log(`  # Frecuencia`);
      console.log(`  POST   /api/clientes/frecuencia`);
      console.log(`  GET    /api/clientes/clientes/:cliente_id/productos-frecuentes`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar la BD:', error);
    process.exit(1);
  });