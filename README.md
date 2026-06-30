# Farmadol ERP

## Desarrollo local

El login y la API no funcionan con un servidor solo de archivos estáticos (Live Server en el puerto 5500, abrir `index.html` directamente, etc.). Necesitas el backend en ejecución.

### Arranque recomendado

**Terminal 1 — Auth service (puerto 3001)**

```bash
cd auth-service
npm start
```

**Terminal 2 — API Gateway (puerto 3000, sirve el frontend y hace proxy a la API)**

```bash
cd api-gateway
npm start
```

Abre en el navegador: **http://localhost:3000/**

### Alternativa: servidor frontend (puerto 3002)

Si prefieres el servidor del frontend con proxy directo al auth-service:

```bash
cd frontend
npm install
npm start
```

Requiere que el auth-service siga corriendo en el puerto 3001. Abre **http://localhost:3002/**

### Live Server (puerto 5500)

Si usas la extensión Live Server de VS Code:

1. Deben estar en marcha el **auth-service** (3001) y el **API Gateway** (3000).
2. El frontend detecta el puerto 5500 y envía las peticiones API a `http://localhost:3000` automáticamente (`frontend/public/js/config.js`).

Para forzar otra URL de API:

```js
localStorage.setItem('API_BASE_URL', 'http://localhost:3000');
```

### Credenciales de prueba

Tras ejecutar el seed del auth-service:

- Email: `admin@farmadol.com`
- Contraseña: `admin123`

```bash
cd auth-service
npm run seed
```

### Puertos

| Servicio      | Puerto |
|---------------|--------|
| API Gateway   | 3000   |
| Auth service  | 3001   |
| Frontend dev  | 3002   |
| Live Server   | 5500   |

npx serve . -p 3010