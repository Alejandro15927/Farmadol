// frontend/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3010;

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3010', 'http://127.0.0.1:3000', 'http://127.0.0.1:3010'],
  credentials: true
}));

// Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir archivos JS
app.get('/js/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path));
});

// Ruta para servir CSS
app.get('/css/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path));
});

// Todas las rutas al index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎨 Frontend corriendo en http://localhost:${PORT}`);
  console.log(`📁 Sirviendo archivos desde: ${path.join(__dirname, 'public')}`);
  console.log(`📋 Acceso: http://localhost:${PORT}`);
});