require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

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
  res.status(200).json({ 
    status: 'OK', 
    service: 'sucursal-service',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
sequelize.sync()
  .then(() => {
    console.log('📦 Base de datos sincronizada');
    app.listen(PORT, () => {
      console.log(`🏢 Sucursal Service corriendo en http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`  # Sucursales (Protegido)`);
      console.log(`  GET    /api/sucursales`);
      console.log(`  GET    /api/sucursales/activas`);
      console.log(`  GET    /api/sucursales/check/:id`);
      console.log(`  GET    /api/sucursales/:id`);
      console.log(`  POST   /api/sucursales (ADMIN)`);
      console.log(`  PUT    /api/sucursales/:id (ADMIN)`);
      console.log(`  DELETE /api/sucursales/:id (ADMIN)`);
      console.log(`  PUT    /api/sucursales/:id/enable (ADMIN)`);
    });
  })
  .catch(error => {
    console.error('❌ Error al conectar la BD:', error);
    process.exit(1);
  });