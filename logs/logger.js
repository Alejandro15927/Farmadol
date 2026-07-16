const fs = require('fs');
const path = require('path');

// Ruta del archivo de logs
const LOG_FILE = path.join(__dirname, 'Logs.txt');

// Asegurar que el archivo existe
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

// Niveles de log
const LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG'
};

// Colores para consola
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 19);
}

function getColor(level) {
  switch (level) {
    case 'INFO': return COLORS.green;
    case 'WARN': return COLORS.yellow;
    case 'ERROR': return COLORS.red;
    case 'DEBUG': return COLORS.cyan;
    default: return COLORS.reset;
  }
}

function writeLog(level, service, message, data = null) {
  const timestamp = getTimestamp();
  let logLine = `[${timestamp}] [${level}] [${service}] ${message}`;
  
  if (data) {
    const dataStr = typeof data === 'object' ? JSON.stringify(data) : data;
    logLine += ` | ${dataStr}`;
  }
  
  // Escribir al archivo
  try {
    fs.appendFileSync(LOG_FILE, logLine + '\n');
  } catch (error) {
    console.error(`❌ Error escribiendo log: ${error.message}`);
  }
  
  // Mostrar en consola con color
  const color = getColor(level);
  console.log(`${color}${logLine}${COLORS.reset}`);
}

// Logger principal
const logger = {
  info: (service, message, data) => writeLog('INFO', service, message, data),
  warn: (service, message, data) => writeLog('WARN', service, message, data),
  error: (service, message, data) => writeLog('ERROR', service, message, data),
  debug: (service, message, data) => writeLog('DEBUG', service, message, data),
  
  // Para conexiones de servicios
  serviceConnected: (service, url) => {
    logger.info(service, `🚀 Servicio conectado`, { url });
  },
  
  // Para peticiones
  request: (service, method, path, status, duration, data = null) => {
    const logData = { method, path, status, duration: `${duration}ms` };
    if (data) logData.data = data;
    logger.info(service, `📨 ${method} ${path} → ${status}`, logData);
  },
  
  // Para errores de servicios
  serviceError: (service, message, error = null) => {
    logger.error(service, `❌ ${message}`, error ? { error: error.message || error } : null);
  },
  
  // Para inicio de microservicio
  serviceStart: (service, port) => {
    logger.info(service, `🔐 Servicio iniciado en puerto ${port}`, { port });
  },
  
  // Para sincronización de BD
  dbSync: (service) => {
    logger.info(service, `📦 Base de datos sincronizada`);
  }
};

module.exports = logger;