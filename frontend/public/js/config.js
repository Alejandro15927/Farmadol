const GATEWAY_PORT = '3000';
const FRONTEND_PORT = '3002';
const DEFAULT_GATEWAY_URL = 'http://localhost:3000';

function getApiBase() {
  const override = localStorage.getItem('API_BASE_URL');
  if (override) {
    return override.replace(/\/$/, '');
  }

  const port = window.location.port;
  if (port === GATEWAY_PORT || port === FRONTEND_PORT) {
    return '';
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
    return 'API no disponible: inicia el API Gateway en el puerto 3000 (y el auth-service en 3001).';
  }
  if (data && data.message) {
    return data.message;
  }
  if (response.status >= 500) {
    return 'Error del servidor. Intenta de nuevo más tarde.';
  }
  if (response.status === 401 || response.status === 400) {
    return 'Invalid email or password';
  }
  return 'Connection error. Please try again.';
}
