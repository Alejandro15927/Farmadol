require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

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
      console.log(`  # Clientes (Protegido)`);
      console.log(`  GET    /api/clientes`);
      console.log(`  GET    /api/clientes/frecuentes`);
      console.log(`  GET    /api/clientes/estadisticas (ADMIN/GERENTE)`);
      console.log(`  GET    /api/clientes/documento/:documento`);
      console.log(`  GET    /api/clientes/:id`);
      console.log(`  POST   /api/clientes (ADMIN/GERENTE/CAJERO)`);
      console.log(`  PUT    /api/clientes/:id (ADMIN/GERENTE/CAJERO)`);
      console.log(`  DELETE /api/clientes/:id (ADMIN/GERENTE)`);
      console.log(`  PUT    /api/clientes/:id/enable (ADMIN/GERENTE)`);
      console.log(`  # Direcciones`);
      console.log(`  POST   /api/clientes/:cliente_id/direcciones (ADMIN/GERENTE/CAJERO)`);
      console.log(`  PUT    /api/clientes/direcciones/:id (ADMIN/GERENTE/CAJERO)`);
      console.log(`  DELETE /api/clientes/direcciones/:id (ADMIN/GERENTE)`);
      console.log(`  # Historial de Compras`);
      console.log(`  POST   /api/clientes/:cliente_id/historial (ADMIN/GERENTE/CAJERO)`);
      console.log(`  GET    /api/clientes/:cliente_id/historial`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar la BD:', error);
    process.exit(1);
  });