const axios = require('axios');
const INVENTARIO_SERVICE_URL = process.env.INVENTARIO_SERVICE_URL || 'http://localhost:3004';

class InventarioService {
  constructor(token) {
    this.token = token;
    this.headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getStockBajo(sucursal_id = null) {
    try {
      const url = `${INVENTARIO_SERVICE_URL}/api/inventario/stock-bajo`;
      const params = sucursal_id ? { sucursal_id } : {};
      const response = await axios.get(url, { 
        headers: this.headers,
        params 
      });
      return response.data;
    } catch (error) {
      console.error('Error en getStockBajo:', error.message);
      return { success: false, data: [] };
    }
  }

  async getProximosVencer(dias = 30, sucursal_id = null) {
    try {
      const url = `${INVENTARIO_SERVICE_URL}/api/inventario/proximos-vencer`;
      const params = { dias };
      if (sucursal_id) params.sucursal_id = sucursal_id;
      const response = await axios.get(url, { 
        headers: this.headers,
        params 
      });
      return response.data;
    } catch (error) {
      console.error('Error en getProximosVencer:', error.message);
      return { success: false, data: [] };
    }
  }

  async getStockProducto(producto_id) {
    try {
      const url = `${INVENTARIO_SERVICE_URL}/api/inventario/stock/producto/${producto_id}`;
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error en getStockProducto:', error.message);
      return { success: false, data: [] };
    }
  }

  async getProductos() {
    try {
      const url = `${INVENTARIO_SERVICE_URL}/api/inventario/productos`;
      const response = await axios.get(url, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('Error en getProductos:', error.message);
      return { success: false, data: [] };
    }
  }
}

module.exports = InventarioService;