const axios = require('axios');
const CLIENTE_SERVICE_URL = process.env.CLIENTE_SERVICE_URL || 'http://localhost:3006';

class ClienteService {
  constructor(token) {
    this.token = token;
    this.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getClientesFrecuentes(params = {}) {
    try {
      const url = `${CLIENTE_SERVICE_URL}/api/clientes/clientes/frecuentes`;
      const response = await axios.get(url, { 
        headers: this.headers,
        params 
      });
      return response.data;
    } catch (error) {
      console.error('Error en getClientesFrecuentes:', error.message);
      return { success: false, data: [] };
    }
  }

  async getEstadisticas() {
    try {
      const url = `${CLIENTE_SERVICE_URL}/api/clientes/clientes/estadisticas`;
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error en getEstadisticas:', error.message);
      return { success: false, data: {} };
    }
  }

  async getClienteById(cliente_id) {
    try {
      const url = `${CLIENTE_SERVICE_URL}/api/clientes/clientes/${cliente_id}`;
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error en getClienteById:', error.message);
      return { success: false, data: null };
    }
  }
}

module.exports = ClienteService;