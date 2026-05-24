const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Todas las rutas no encontradas redirigen a index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🎨 Frontend corriendo en http://localhost:${PORT}`);
});