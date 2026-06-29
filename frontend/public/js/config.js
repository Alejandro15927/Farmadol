// public/js/config.js
const GATEWAY_PORT = '3000';
const FRONTEND_PORT = '3010';
const DEFAULT_GATEWAY_URL = 'http://localhost:3000';

function getApiBase() {
  const override = localStorage.getItem('API_BASE_URL');
  if (override) {
    return override.replace(/\/$/, '');
  }

  const port = window.location.port;
  
  // Si estamos en el puerto del frontend
  if (port === GATEWAY_PORT || port === FRONTEND_PORT) {
    return DEFAULT_GATEWAY_URL;
  }

  return DEFAULT_GATEWAY_URL;
}

function parseJsonResponse(text, contentType) {
  if (!text) {
    return null;
  }
  const isJson = contentType && contentType.includes('application/json');
  if (!isJson) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getLoginErrorMessage(response, data) {
  if (response.status === 405) {
    return 'API no disponible: inicia el API Gateway en el puerto 3000.';
  }
  if (data && data.message) {
    return data.message;
  }
  if (response.status >= 500) {
    return 'Error del servidor. Intenta de nuevo más tarde.';
  }
  if (response.status === 401 || response.status === 400) {
    return 'Credenciales inválidas';
  }
  return `Error ${response.status}: ${response.statusText}`;
}

console.log('✅ config.js cargado');
console.log('📡 API Base:', getApiBase());