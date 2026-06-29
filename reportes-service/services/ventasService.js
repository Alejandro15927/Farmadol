const axios = require('axios');
const VENTAS_SERVICE_URL = process.env.VENTAS_SERVICE_URL || 'http://localhost:3005';

class VentasService {
  constructor(token) {
    this.token = token;
    this.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getVentas(params = {}) {
    try {
      const url = `${VENTAS_SERVICE_URL}/api/ventas/ventas`;
      const response = await axios.get(url, { 
        headers: this.headers,
        params 
      });
      return response.data;
    } catch (error) {
      console.error('Error en getVentas:', error.message);
      return { success: false, data: [] };
    }
  }

  async getVentasDelDia(sucursal_id = null) {
    try {
      const url = `${VENTAS_SERVICE_URL}/api/ventas/ventas/dia/resumen`;
      const params = sucursal_id ? { sucursal_id } : {};
      const response = await axios.get(url, { 
        headers: this.headers,
        params 
      });
      return response.data;
    } catch (error) {
      console.error('Error en getVentasDelDia:', error.message);
      return { success: false, data: {} };
    }
  }

  async getProductosMasVendidos(params = {}) {
    try {
      const url = `${VENTAS_SERVICE_URL}/api/ventas/ventas/top/productos`;
      const response = await axios.get(url, { 
        headers: this.headers,
        params 
      });
      return response.data;
    } catch (error) {
      console.error('Error en getProductosMasVendidos:', error.message);
      return { success: false, data: [] };
    }
  }

  async getVentaById(venta_id) {
    try {
      const url = `${VENTAS_SERVICE_URL}/api/ventas/ventas/${venta_id}`;
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error en getVentaById:', error.message);
      return { success: false, data: null };
    }
  }
}

module.exports = VentasService;