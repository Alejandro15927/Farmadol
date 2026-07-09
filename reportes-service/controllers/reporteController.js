const { Alerta, Reporte } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const VENTA_SERVICE_URL = process.env.VENTA_SERVICE_URL || 'http://localhost:3005';
const INVENTARIO_SERVICE_URL = process.env.INVENTARIO_SERVICE_URL || 'http://localhost:3004';
const CLIENTE_SERVICE_URL = process.env.CLIENTE_SERVICE_URL || 'http://localhost:3003';
const COMPRA_SERVICE_URL = process.env.COMPRA_SERVICE_URL || 'http://localhost:3006';
const SUCURSAL_SERVICE_URL = process.env.SUCURSAL_SERVICE_URL || 'http://localhost:3002';

// Directorio para almacenar archivos de reportes
const REPORTES_DIR = path.join(__dirname, '..', 'reportes_archivos');

// Asegurar que el directorio existe
if (!fs.existsSync(REPORTES_DIR)) {
  fs.mkdirSync(REPORTES_DIR, { recursive: true });
}

// ============ CACHÉ DE NOMBRES ============
let cacheSucursales = {};
let cacheProductos = {};
let cacheClientes = {};
let lastCacheTime = 0;

async function refreshCache(authHeader) {
  const now = Date.now();
  // Refrescar caché cada 5 minutos
  if (now - lastCacheTime < 300000 && Object.keys(cacheSucursales).length > 0) {
    return;
  }
  
  try {
    // Obtener sucursales
    const sucResp = await fetch(`${SUCURSAL_SERVICE_URL}/api/sucursales`, {
      headers: { Authorization: authHeader }
    });
    if (sucResp.ok) {
      const sucData = await sucResp.json();
      console.log('📦 Sucursales recibidas:', {
        success: sucData.success,
        count: sucData.data?.length,
        sample: sucData.data?.[0]
      });
      if (sucData.success && sucData.data) {
        sucData.data.forEach(s => {
          cacheSucursales[s.id] = s.nombre || `Sucursal ${s.id}`;
        });
      }
    }

    // Obtener productos
    const prodResp = await fetch(`${INVENTARIO_SERVICE_URL}/api/inventario/productos`, {
      headers: { Authorization: authHeader }
    });
    if (prodResp.ok) {
      const prodData = await prodResp.json();
      console.log('📦 Productos recibidos:', {
        success: prodData.success,
        count: prodData.data?.length,
        sample: prodData.data?.[0]
      });
      if (prodData.success && prodData.data) {
        prodData.data.forEach(p => {
          cacheProductos[p.id] = p.nombre || `Producto ${p.id}`;
        });
      }
    }

    // Obtener clientes - CORREGIDO: mejor manejo de formato de respuesta
    const cliResp = await fetch(`${CLIENTE_SERVICE_URL}/api/clientes`, {
  headers: { Authorization: authHeader }
});
if (cliResp.ok) {
  const cliData = await cliResp.json();
  
  let clientes = [];
  if (cliData.success && Array.isArray(cliData.data)) {
    clientes = cliData.data;
  } else if (Array.isArray(cliData.data?.clientes)) {
    clientes = cliData.data.clientes;
  } else if (Array.isArray(cliData)) {
    clientes = cliData;
  }
  
  clientes.forEach(c => {
    // Construir nombre completo igual que en el reporte
    let nombre;
    if (c.razon_social) {
      nombre = c.razon_social;
    } else if (c.nombres || c.apellidos) {
      nombre = `${c.nombres || ''} ${c.apellidos || ''}`.trim();
    } else {
      nombre = c.nombre || c.name || c.nombre_completo || `Cliente ${c.id}`;
    }
    cacheClientes[c.id] = nombre;
  });
  
  console.log('📦 Cache clientes:', Object.keys(cacheClientes).length, 'cargados');
}


    lastCacheTime = now;
    console.log('📦 Caché actualizada:', {
      sucursales: Object.keys(cacheSucursales).length,
      productos: Object.keys(cacheProductos).length,
      clientes: Object.keys(cacheClientes).length
    });
  } catch (error) {
    console.error('Error actualizando caché:', error.message);
  }
}


function getNombreSucursal(id) {
  if (!id) return 'N/A';
  return cacheSucursales[id] || `Sucursal ${id}`;
}

function getNombreProducto(id) {
  if (!id) return 'N/A';
  return cacheProductos[id] || `Producto ${id}`;
}

function getNombreCliente(id) {
  if (!id) return 'N/A';
  const nombre = cacheClientes[id];
  if (nombre && nombre !== `Cliente ${id}` && !nombre.startsWith('Cliente ')) {
    return nombre;
  }
  // Si no está en caché o es genérico, devolver el ID
  return `Cliente #${id}`;
}


// ============ FUNCIONES AUXILIARES ============

async function fetchFromService(url, authHeader) {
  const response = await fetch(url, {
    headers: { Authorization: authHeader }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Error al consultar ${url}`);
  }
  return data;
}

function getTipoLabel(tipo) {
  const labels = {
    ventas_diarias: 'Ventas Diarias',
    ventas_mensuales: 'Ventas Mensuales',
    productos_mas_vendidos: 'Productos Más Vendidos',
    stock_bajo: 'Stock Bajo',
    productos_vencer: 'Próximos a Vencer',
    clientes_frecuentes: 'Clientes Frecuentes',
    resumen_general: 'Resumen General',
    rotacion_inventario: 'Rotación de Inventario',
    compras_proveedores: 'Compras por Proveedor',
    ventas_sucursal: 'Ventas por Sucursal',
    ventas_vendedor: 'Ventas por Vendedor',
  };
  return labels[tipo] || tipo;
}

// Traducir nombres de columnas para mostrar
function traducirColumna(key) {
  const traducciones = {
    'fecha': 'Fecha',
    'total_ventas': 'Total Ventas',
    'total_monto': 'Monto Total',
    'total_productos': 'Productos Vendidos',
    'mes': 'Mes',
    'producto_id': 'Producto',
    'nombre': 'Nombre',
    'producto': 'Producto',
    'cantidad': 'Cantidad',
    'total_vendido': 'Total Vendido',
    'sucursal_id': 'Sucursal',
    'usuario_id': 'Vendedor',
    'cliente_id': 'Cliente',
    'proveedor_id': 'Proveedor',
    'proveedor': 'Proveedor',
    'total_compras': 'Total Compras',
    'total': 'Total',
    'stock_actual': 'Stock Actual',
    'stock_minimo': 'Stock Mínimo',
    'fecha_vencimiento': 'Fecha Vencimiento',
    'dias_restantes': 'Días Restantes',
    'precio': 'Precio',
    'email': 'Email',
    'telefono': 'Teléfono',
    'compras': 'Compras',
    'razon_social': 'Razón Social'
  };
  return traducciones[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Traducir valores de celdas (IDs a nombres)
function traducirValor(key, value) {
  if (value === null || value === undefined) return '';
  
  const strValue = String(value);
  
  // Si es un ID y tenemos el nombre en caché
  if (key === 'producto_id' || key === 'producto') {
    const nombre = getNombreProducto(value);
    return nombre !== `Producto ${value}` ? nombre : strValue;
  }
  if (key === 'sucursal_id' || key === 'sucursal') {
    const nombre = getNombreSucursal(value);
    return nombre !== `Sucursal ${value}` ? nombre : strValue;
  }
  if (key === 'cliente_id' || key === 'cliente') {
    const nombre = getNombreCliente(value);
    return nombre !== `Cliente ${value}` ? nombre : strValue;
  }
  
  return strValue;
}

// Función para truncar texto largo
function truncarTexto(texto, maxLength = 30) {
  if (!texto) return '';
  const str = String(texto);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

// Generar PDF mejorado
function generarPDF(datos, titulo) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: titulo,
          Author: 'Farmadol System',
          Subject: 'Reporte',
          Keywords: 'reporte, farmadol',
          CreationDate: new Date()
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Título
      doc.fontSize(18).font('Helvetica-Bold').text(titulo, { align: 'center' });
      doc.moveDown(0.3);
      
      // Fecha
      doc.fontSize(9).font('Helvetica').fillColor('#666666').text(
        `Fecha de generación: ${new Date().toLocaleString('es-ES')}`,
        { align: 'center' }
      );
      doc.fillColor('#000000');
      doc.moveDown(0.8);

      // Línea separadora
      doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke('#cccccc');
      doc.moveDown(0.8);

      if (Array.isArray(datos) && datos.length > 0) {
        // Filtrar claves que no queremos mostrar
        const excludeKeys = ['fecha_generacion', 'createdAt', 'updatedAt'];
        const allKeys = new Set();
        datos.forEach(row => {
          Object.keys(row).forEach(key => {
            if (!excludeKeys.includes(key)) {
              allKeys.add(key);
            }
          });
        });
        const headers = Array.from(allKeys);

        // Calcular anchos de columna dinámicamente
        const pageWidth = 515; // Ancho útil de página (555 - 40)
        const minColWidth = 60;
        const totalMinWidth = headers.length * minColWidth;
        
        let colWidths;
        if (totalMinWidth > pageWidth) {
          // Si no caben todas las columnas, distribuir equitativamente
          colWidths = headers.map(() => Math.floor(pageWidth / headers.length));
        } else {
          // Calcular anchos basados en contenido
          colWidths = headers.map(header => {
            const headerWidth = doc.widthOfString(traducirColumna(header)) + 10;
            let maxDataWidth = 0;
            datos.forEach(row => {
              const valor = traducirValor(header, row[header]);
              const w = doc.widthOfString(truncarTexto(valor, 40)) + 8;
              if (w > maxDataWidth) maxDataWidth = w;
            });
            return Math.max(minColWidth, headerWidth, maxDataWidth);
          });

          // Ajustar para que no exceda el ancho de página
          const totalWidth = colWidths.reduce((a, b) => a + b, 0);
          if (totalWidth > pageWidth) {
            const ratio = pageWidth / totalWidth;
            colWidths = colWidths.map(w => Math.floor(w * ratio));
          }
        }

        const rowHeight = 18;
        const headerHeight = 22;

        // Función para dibujar headers
        const drawHeaders = (y) => {
          doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
          let xPos = 40;
          headers.forEach((header, i) => {
            doc.text(
              traducirColumna(header),
              xPos,
              y + 4,
              {
                width: colWidths[i],
                align: 'left',
                lineBreak: false
              }
            );
            xPos += colWidths[i];
          });
          doc.fillColor('#000000');
          // Línea debajo de headers
          doc.moveTo(40, y + headerHeight).lineTo(555, y + headerHeight).stroke('#000000');
          doc.lineWidth(0.5);
        };

        // Dibujar headers iniciales
        let tableTop = doc.y;
        drawHeaders(tableTop);

        // Dibujar datos
        let yPosition = tableTop + headerHeight + 4;
        doc.fontSize(7.5).font('Helvetica');

        datos.forEach((row, rowIndex) => {
          // Verificar si necesitamos nueva página
          if (yPosition + rowHeight > 780) {
            doc.addPage();
            yPosition = 50;
            drawHeaders(yPosition);
            yPosition += headerHeight + 4;
            doc.fontSize(7.5).font('Helvetica');
          }

          // Color de fondo alternado
          if (rowIndex % 2 === 1) {
            doc.rect(40, yPosition - 1, 515, rowHeight).fill('#f8f9fa');
          }

          let xPos = 40;
          headers.forEach((header, i) => {
            const rawValue = row[header];
            const displayValue = traducirValor(header, rawValue);
            const cellText = truncarTexto(displayValue, Math.floor(colWidths[i] / 4));

            doc.fillColor('#333333').text(
              cellText,
              xPos,
              yPosition + 2,
              {
                width: colWidths[i] - 4,
                align: 'left',
                lineBreak: false
              }
            );
            xPos += colWidths[i];
          });

          yPosition += rowHeight;
        });

      } else if (typeof datos === 'object' && !Array.isArray(datos) && Object.keys(datos).length > 0) {
        // Datos como objeto (resumen general)
        doc.fontSize(10).font('Helvetica');
        
        // Procesar secciones del resumen
        const seccionesPrincipales = ['ventas', 'inventario', 'clientes', 'compras'];
        const procesado = new Set();
        
        // Primero mostrar valores simples
        let tieneValoresSimples = false;
        Object.entries(datos).forEach(([key, value]) => {
          if (key === 'fecha_generacion') return;
          if (typeof value !== 'object' || value === null) {
            tieneValoresSimples = true;
          }
        });

        if (tieneValoresSimples) {
          doc.fontSize(11).font('Helvetica-Bold').text('Resumen', { underline: true });
          doc.moveDown(0.5);
        }

        Object.entries(datos).forEach(([key, value]) => {
          if (key === 'fecha_generacion') return;
          
          if (typeof value !== 'object' || value === null) {
            if (doc.y > 750) doc.addPage();
            doc.fontSize(9).font('Helvetica-Bold').text(`${traducirColumna(key)}: `, { continued: true });
            doc.font('Helvetica').text(String(value ?? 'N/A'));
            doc.moveDown(0.3);
          }
        });

        // Luego procesar objetos anidados (ventas, inventario, etc.)
        seccionesPrincipales.forEach(seccion => {
          if (datos[seccion] && typeof datos[seccion] === 'object' && !Array.isArray(datos[seccion])) {
            procesado.add(seccion);
            
            if (doc.y > 700) doc.addPage();
            
            doc.moveDown(0.5);
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#2563eb').text(
              traducirColumna(seccion),
              { underline: true }
            );
            doc.fillColor('#000000');
            doc.moveDown(0.5);

            const subData = datos[seccion];
            const subKeys = Object.keys(subData).filter(k => !['fecha_generacion', 'createdAt', 'updatedAt'].includes(k));
            
            if (subKeys.length > 0) {
              // Si tiene pocos valores, mostrarlos como lista
              if (subKeys.length <= 10) {
                subKeys.forEach(subKey => {
                  if (doc.y > 750) doc.addPage();
                  doc.fontSize(9).font('Helvetica-Bold').text(`${traducirColumna(subKey)}: `, { continued: true, indent: 20 });
                  doc.font('Helvetica').text(String(subData[subKey] ?? 'N/A'));
                  doc.moveDown(0.2);
                });
              } else {
                // Si tiene muchos, mostrarlos en mini-tabla
                const miniTableData = subKeys.map(k => ({
                  Indicador: traducirColumna(k),
                  Valor: String(subData[k] ?? 'N/A')
                }));
                drawMiniTable(doc, miniTableData);
              }
            }
          }
        });

        // Procesar secciones que son arrays
        Object.entries(datos).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0 && !procesado.has(key)) {
            doc.addPage();
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#2563eb').text(
              traducirColumna(key),
              { underline: true, align: 'center' }
            );
            doc.fillColor('#000000');
            doc.moveDown(0.8);
            
            drawDataTable(doc, value);
          }
        });

      } else {
        doc.fontSize(12).font('Helvetica').fillColor('#999999').text(
          'No hay datos disponibles para este reporte.',
          { align: 'center' }
        );
        doc.fillColor('#000000');
      }

      // Pie de página
      const bottomY = Math.max(doc.y + 20, 790);
      doc.y = bottomY;
      doc.moveTo(40, bottomY).lineTo(555, bottomY).stroke('#cccccc');
      doc.moveDown(0.3);
      doc.fontSize(7).font('Helvetica').fillColor('#999999').text(
        'Generado por Farmadol - Sistema de Gestión',
        { align: 'center' }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Función auxiliar para dibujar mini-tabla
function drawMiniTable(doc, data) {
  if (!data || data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const colWidth = 250;
  
  let yPos = doc.y;
  
  // Headers
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
  doc.text(headers[0], 60, yPos, { width: colWidth, align: 'left' });
  doc.text(headers[1], 310, yPos, { width: colWidth, align: 'left' });
  
  yPos += 18;
  doc.moveTo(60, yPos).lineTo(560, yPos).stroke('#000000');
  yPos += 4;
  
  // Data
  doc.fontSize(8).font('Helvetica');
  data.forEach((row, i) => {
    if (yPos > 770) {
      doc.addPage();
      yPos = 50;
    }
    if (i % 2 === 1) {
      doc.rect(60, yPos - 1, 500, 16).fill('#f8f9fa');
    }
    doc.fillColor('#333333');
    doc.text(String(row[headers[0]] ?? ''), 60, yPos + 2, { width: colWidth, align: 'left', lineBreak: false });
    doc.text(String(row[headers[1]] ?? ''), 310, yPos + 2, { width: colWidth, align: 'left', lineBreak: false });
    yPos += 16;
  });
  
  doc.y = yPos + 5;
}

// Función auxiliar para dibujar tabla de datos
function drawDataTable(doc, data) {
  if (!data || data.length === 0) return;
  
  const excludeKeys = ['fecha_generacion', 'createdAt', 'updatedAt'];
  const allKeys = new Set();
  data.forEach(row => {
    Object.keys(row).forEach(key => {
      if (!excludeKeys.includes(key)) allKeys.add(key);
    });
  });
  const headers = Array.from(allKeys);
  
  const pageWidth = 515;
  const minColWidth = 55;
  let colWidths = headers.map(() => Math.floor(pageWidth / headers.length));
  
  const rowHeight = 18;
  const headerHeight = 22;
  
  const drawHeaders = (y) => {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#333333');
    let xPos = 40;
    headers.forEach((header, i) => {
      doc.text(traducirColumna(header), xPos, y + 4, {
        width: colWidths[i],
        align: 'left',
        lineBreak: false
      });
      xPos += colWidths[i];
    });
    doc.moveTo(40, y + headerHeight).lineTo(555, y + headerHeight).stroke('#000000');
  };
  
  let tableTop = doc.y;
  drawHeaders(tableTop);
  
  let yPosition = tableTop + headerHeight + 4;
  doc.fontSize(7.5).font('Helvetica');
  
  data.forEach((row, rowIndex) => {
    if (yPosition + rowHeight > 780) {
      doc.addPage();
      yPosition = 50;
      drawHeaders(yPosition);
      yPosition += headerHeight + 4;
      doc.fontSize(7.5).font('Helvetica');
    }
    
    if (rowIndex % 2 === 1) {
      doc.rect(40, yPosition - 1, 515, rowHeight).fill('#f8f9fa');
    }
    
    let xPos = 40;
    headers.forEach((header, i) => {
      const valor = traducirValor(header, row[header]);
      doc.fillColor('#333333').text(
        truncarTexto(valor, Math.floor(colWidths[i] / 4)),
        xPos,
        yPosition + 2,
        { width: colWidths[i] - 4, align: 'left', lineBreak: false }
      );
      xPos += colWidths[i];
    });
    
    yPosition += rowHeight;
  });
  
  doc.y = yPosition + 5;
}

// Generar contenido de reporte según formato
async function generarContenidoReporte(datos, formato, tipo) {
  switch (formato) {
    case 'csv':
    case 'excel':
      return generarCSV(datos, tipo);
    case 'json':
      return JSON.stringify(datos, null, 2);
    case 'pdf':
    default:
      return await generarPDF(datos, getTipoLabel(tipo));
  }
}

function generarCSV(datos, tipo) {
  if (!datos || (Array.isArray(datos) && datos.length === 0) || 
      (typeof datos === 'object' && !Array.isArray(datos) && Object.keys(datos).length === 0)) {
    return 'No hay datos disponibles';
  }

  let csv = '';
  
  if (Array.isArray(datos)) {
    if (datos.length > 0) {
      const excludeKeys = ['fecha_generacion', 'createdAt', 'updatedAt'];
      const allKeys = new Set();
      datos.forEach(row => {
        Object.keys(row).forEach(key => {
          if (!excludeKeys.includes(key)) allKeys.add(key);
        });
      });
      const headers = Array.from(allKeys);
      
      csv += headers.map(h => traducirColumna(h)).join(',') + '\n';
      
      datos.forEach(row => {
        csv += headers.map(h => {
          const value = traducirValor(h, row[h]);
          return value !== null && value !== undefined ? `"${String(value).replace(/"/g, '""')}"` : '';
        }).join(',') + '\n';
      });
    }
  } else {
    const headers = Object.keys(datos).filter(k => k !== 'fecha_generacion');
    csv += headers.map(h => traducirColumna(h)).join(',') + '\n';
    csv += headers.map(h => {
      const value = datos[h];
      return value !== null && value !== undefined ? `"${String(value).replace(/"/g, '""')}"` : '';
    }).join(',') + '\n';
  }
  
  return csv;
}

// Guardar archivo de reporte
function guardarArchivoReporte(contenido, tipo, formato) {
  const timestamp = Date.now();
  const extension = formato === 'excel' ? 'csv' : formato;
  const nombreArchivo = `${tipo}_${timestamp}.${extension}`;
  const rutaCompleta = path.join(REPORTES_DIR, nombreArchivo);
  
  fs.writeFileSync(rutaCompleta, contenido);
  
  return {
    ruta_archivo: `/reportes_archivos/${nombreArchivo}`,
    tamanio: fs.statSync(rutaCompleta).size
  };
}

// ============ REPORTES ============

// Generar reporte de ventas
const generarReporteVentas = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tipo, fecha_inicio, fecha_fin, sucursal_id, formato = 'pdf' } = req.body;
    const authHeader = req.headers.authorization;
    const usuario_id = req.user.id;

    await refreshCache(authHeader);

    let url = `${VENTA_SERVICE_URL}/api/ventas/ventas?`;
    if (fecha_inicio && fecha_fin) {
      url += `fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;
    }
    if (sucursal_id) {
      url += `&sucursal_id=${sucursal_id}`;
    }

    const ventasData = await fetchFromService(url, authHeader);
    
    // Log para debug
    console.log(`📊 Ventas data recibida:`, {
      success: ventasData.success,
      dataType: typeof ventasData.data,
      isArray: Array.isArray(ventasData.data),
      length: ventasData.data?.length,
      sample: Array.isArray(ventasData.data) ? ventasData.data[0] : ventasData.data
    });

    let datosReporte = {};
    let nombreReporte = '';

    switch (tipo) {
      case 'ventas_diarias':
        nombreReporte = `Reporte de Ventas Diarias - ${new Date().toLocaleDateString('es-ES')}`;
        datosReporte = procesarVentasDiarias(ventasData.data);
        break;
      case 'ventas_mensuales':
        nombreReporte = `Reporte de Ventas Mensuales - ${new Date().toLocaleDateString('es-ES')}`;
        datosReporte = procesarVentasMensuales(ventasData.data);
        break;
      case 'productos_mas_vendidos':
  nombreReporte = 'Top Productos Más Vendidos';
  const topUrl = `${VENTA_SERVICE_URL}/api/ventas/ventas/top/productos?limit=20`;
  const topData = await fetchFromService(topUrl, authHeader);
  datosReporte = topData.data || [];
  // Formatear con solo 4 columnas: Producto, Cantidad, Total, Ventas
  if (Array.isArray(datosReporte)) {
    datosReporte = datosReporte.map(item => ({
      Producto: item.producto_nombre || getNombreProducto(item.producto_id) || 'N/A',
      Cantidad: item.cantidad || item.total_vendido || item.cantidad_vendida || 0,
      'Total Vendido': item.total_vendido || item.cantidad || item.cantidad_vendida || 0,
      Ventas: item.total_ventas || item.numero_ventas || item.ventas || 0
    }));
  }
  break;
      case 'ventas_sucursal':
        nombreReporte = 'Reporte de Ventas por Sucursal';
        datosReporte = procesarVentasPorSucursal(ventasData.data);
        break;
      case 'ventas_vendedor':
        nombreReporte = 'Reporte de Ventas por Vendedor';
        datosReporte = procesarVentasPorVendedor(ventasData.data);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Tipo de reporte no válido' });
    }

    // Log de datos procesados
    console.log(`📊 Datos procesados (${tipo}):`, {
      type: typeof datosReporte,
      isArray: Array.isArray(datosReporte),
      length: Array.isArray(datosReporte) ? datosReporte.length : Object.keys(datosReporte).length,
      sample: Array.isArray(datosReporte) ? datosReporte[0] : Object.keys(datosReporte).slice(0, 3)
    });

    const contenido = await generarContenidoReporte(datosReporte, formato, tipo);
    const archivo = guardarArchivoReporte(contenido, tipo, formato);

    const reporte = await Reporte.create({
      tipo,
      nombre: nombreReporte,
      descripcion: req.body.descripcion || `Reporte generado automáticamente`,
      parametros: JSON.stringify({ fecha_inicio, fecha_fin, sucursal_id }),
      formato,
      ruta_archivo: archivo.ruta_archivo,
      usuario_id,
      sucursal_id: sucursal_id || null,
      fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
      fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
      total_registros: Array.isArray(datosReporte) ? datosReporte.length : Object.keys(datosReporte).length,
      tamanio_archivo: archivo.tamanio,
      estado: 'completado',
      fecha_completado: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: { reporte, contenido: datosReporte }
    });
  } catch (error) {
    console.error('Error en generarReporteVentas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
  }
};

// Generar reporte de inventario
const generarReporteInventario = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tipo, sucursal_id, dias = 30, formato = 'pdf' } = req.body;
    const authHeader = req.headers.authorization;
    const usuario_id = req.user.id;

    await refreshCache(authHeader);

    let datosReporte = {};
    let nombreReporte = '';
    let url = '';

    switch (tipo) {
      case 'stock_bajo':
        nombreReporte = 'Reporte de Productos con Stock Bajo';
        url = `${INVENTARIO_SERVICE_URL}/api/inventario/alertas/stock-bajo`;
        if (sucursal_id) url += `?sucursal_id=${sucursal_id}`;
        const stockData = await fetchFromService(url, authHeader);
        datosReporte = stockData.data || [];
        // Traducir IDs
        if (Array.isArray(datosReporte)) {
          datosReporte = datosReporte.map(item => ({
            Producto: getNombreProducto(item.producto_id || item.id),
            'Stock Actual': item.stock_actual || item.cantidad || 'N/A',
            'Stock Mínimo': item.stock_minimo || 'N/A',
            Sucursal: getNombreSucursal(item.sucursal_id),
            Precio: item.precio || 'N/A'
          }));
        }
        break;
      case 'productos_vencer':
  nombreReporte = 'Reporte de Productos Próximos a Vencer';
  url = `${INVENTARIO_SERVICE_URL}/api/inventario/alertas/por-vencer?dias=${dias}`;
  if (sucursal_id) url += `&sucursal_id=${sucursal_id}`;
  const vencerData = await fetchFromService(url, authHeader);
  datosReporte = vencerData.data || [];
  
  if (Array.isArray(datosReporte)) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    datosReporte = datosReporte.map(item => {
      // Calcular días restantes
      let diasRestantes = 'N/A';
      const fechaVenc = item.fecha_vencimiento || item.fecha_venc || item.vencimiento;
      if (fechaVenc) {
        const fechaVencimiento = new Date(fechaVenc);
        if (!isNaN(fechaVencimiento.getTime())) {
          fechaVencimiento.setHours(0, 0, 0, 0);
          const diffTime = fechaVencimiento.getTime() - hoy.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          diasRestantes = diffDays;
        }
      }
      
      // El campo real es 'ubicacion_estante'
      const lugarEstante = item.ubicacion_estante || item.ubicacion || item.estante || 'No especificado';
      
      return {
        Producto: getNombreProducto(item.producto_id || item.id) || 'N/A',
        Lote: item.lote || item.numero_lote || 'N/A',
        'Fecha Vencimiento': fechaVenc || 'N/A',
        'Días Restantes': diasRestantes,
        Cantidad: item.cantidad || item.stock || 'N/A',
        Sucursal: getNombreSucursal(item.sucursal_id) || 'N/A',
        'Lugar/Estante': lugarEstante
      };
    });
  }
  break;
      case 'rotacion_inventario':
        nombreReporte = 'Reporte de Rotación de Inventario';
        const ventasUrl = `${VENTA_SERVICE_URL}/api/ventas/ventas`;
        const ventasData = await fetchFromService(ventasUrl, authHeader);
        const productosUrl = `${INVENTARIO_SERVICE_URL}/api/inventario/productos`;
        const productosData = await fetchFromService(productosUrl, authHeader);
        datosReporte = procesarRotacionInventario(ventasData.data, productosData.data);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Tipo de reporte no válido' });
    }

    console.log(`📊 Datos inventario (${tipo}):`, {
      isArray: Array.isArray(datosReporte),
      length: Array.isArray(datosReporte) ? datosReporte.length : Object.keys(datosReporte).length
    });

    const contenido = await generarContenidoReporte(datosReporte, formato, tipo);
    const archivo = guardarArchivoReporte(contenido, tipo, formato);

    const reporte = await Reporte.create({
      tipo,
      nombre: nombreReporte,
      descripcion: req.body.descripcion || `Reporte generado automáticamente`,
      parametros: JSON.stringify({ sucursal_id, dias }),
      formato,
      ruta_archivo: archivo.ruta_archivo,
      usuario_id,
      sucursal_id: sucursal_id || null,
      total_registros: Array.isArray(datosReporte) ? datosReporte.length : 0,
      tamanio_archivo: archivo.tamanio,
      estado: 'completado',
      fecha_completado: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: { reporte, contenido: datosReporte }
    });
  } catch (error) {
    console.error('Error en generarReporteInventario:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
  }
};

// Generar reporte de clientes
const generarReporteClientes = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tipo, limit = 20, min_compras = 3, formato = 'pdf' } = req.body;
    const authHeader = req.headers.authorization;
    const usuario_id = req.user.id;

    await refreshCache(authHeader);

    let datosReporte = {};
    let nombreReporte = '';
    let url = '';

    switch (tipo) {
      case 'clientes_frecuentes':
  nombreReporte = 'Reporte de Clientes Frecuentes';
  url = `${CLIENTE_SERVICE_URL}/api/clientes/frecuentes?limit=${limit}&min_compras=${min_compras}`;
  const clientesData = await fetchFromService(url, authHeader);
  datosReporte = clientesData.data || [];
  
  if (Array.isArray(datosReporte)) {
    datosReporte = datosReporte.map(item => {
      // Construir nombre completo: razon_social para empresas, nombres+apellidos para personas
      let nombreCliente = 'N/A';
      if (item.razon_social) {
        nombreCliente = item.razon_social;
      } else if (item.nombres || item.apellidos) {
        nombreCliente = `${item.nombres || ''} ${item.apellidos || ''}`.trim();
      } else if (item.nombre) {
        nombreCliente = item.nombre;
      } else if (item.nombre_completo) {
        nombreCliente = item.nombre_completo;
      } else {
        nombreCliente = getNombreCliente(item.cliente_id || item.id);
      }
      
      // Para el teléfono
      const telefono = item.telefono || item.phone || item.celular || 
                       item.tel || item.telefono_contacto || 'N/A';
      
      // Para total compras, manejar 0 correctamente
      const totalCompras = item.total_compras !== undefined ? item.total_compras : 
                           item.compras !== undefined ? item.compras : 
                           item.numero_compras !== undefined ? item.numero_compras : 0;
      
      return {
        Cliente: nombreCliente,
        Email: item.email || item.correo || item.mail || 'N/A',
        Teléfono: telefono,
        'Total Compras': totalCompras
      };
    });
  }
  break;
      case 'resumen_general':
        nombreReporte = 'Resumen General de Clientes';
        url = `${CLIENTE_SERVICE_URL}/api/clientes/estadisticas`;
        const estadisticasData = await fetchFromService(url, authHeader);
        datosReporte = estadisticasData.data || {};
        break;
      default:
        return res.status(400).json({ success: false, message: 'Tipo de reporte no válido' });
    }

    const contenido = await generarContenidoReporte(datosReporte, formato, tipo);
    const archivo = guardarArchivoReporte(contenido, tipo, formato);

    const reporte = await Reporte.create({
      tipo,
      nombre: nombreReporte,
      descripcion: req.body.descripcion || `Reporte generado automáticamente`,
      parametros: JSON.stringify({ limit, min_compras }),
      formato,
      ruta_archivo: archivo.ruta_archivo,
      usuario_id,
      total_registros: Array.isArray(datosReporte) ? datosReporte.length : 0,
      tamanio_archivo: archivo.tamanio,
      estado: 'completado',
      fecha_completado: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: { reporte, contenido: datosReporte }
    });
  } catch (error) {
    console.error('Error en generarReporteClientes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
  }
};

// Generar reporte de compras
const generarReporteCompras = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { tipo, fecha_inicio, fecha_fin, proveedor_id, formato = 'pdf' } = req.body;
    const authHeader = req.headers.authorization;
    const usuario_id = req.user.id;

    await refreshCache(authHeader);

    let url = `${COMPRA_SERVICE_URL}/api/compras?`;
    if (fecha_inicio && fecha_fin) {
      url += `fecha_inicio=${fecha_inicio}&fecha_fin=${fecha_fin}`;
    }
    if (proveedor_id) {
      url += `&proveedor_id=${proveedor_id}`;
    }

    const comprasData = await fetchFromService(url, authHeader);
    let datosReporte = {};
    let nombreReporte = '';

    switch (tipo) {
      case 'compras_proveedores':
        nombreReporte = 'Reporte de Compras por Proveedor';
        datosReporte = procesarComprasPorProveedor(comprasData.data);
        break;
      case 'resumen_general':
        nombreReporte = 'Resumen General de Compras';
        const estadisticasUrl = `${COMPRA_SERVICE_URL}/api/compras/estadisticas`;
        const estadisticasData = await fetchFromService(estadisticasUrl, authHeader);
        datosReporte = estadisticasData.data || {};
        break;
      default:
        return res.status(400).json({ success: false, message: 'Tipo de reporte no válido' });
    }

    const contenido = await generarContenidoReporte(datosReporte, formato, tipo);
    const archivo = guardarArchivoReporte(contenido, tipo, formato);

    const reporte = await Reporte.create({
      tipo,
      nombre: nombreReporte,
      descripcion: req.body.descripcion || `Reporte generado automáticamente`,
      parametros: JSON.stringify({ fecha_inicio, fecha_fin, proveedor_id }),
      formato,
      ruta_archivo: archivo.ruta_archivo,
      usuario_id,
      fecha_inicio: fecha_inicio ? new Date(fecha_inicio) : null,
      fecha_fin: fecha_fin ? new Date(fecha_fin) : null,
      total_registros: comprasData.data?.length || 0,
      tamanio_archivo: archivo.tamanio,
      estado: 'completado',
      fecha_completado: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Reporte generado exitosamente',
      data: { reporte, contenido: datosReporte }
    });
  } catch (error) {
    console.error('Error en generarReporteCompras:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
  }
};

// Generar resumen general
const generarResumenGeneral = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const usuario_id = req.user.id;
    const formato = req.body.formato || 'pdf';

    await refreshCache(authHeader);

    const [ventas, inventario, clientes, compras] = await Promise.all([
      fetchFromService(`${VENTA_SERVICE_URL}/api/ventas/ventas/estadisticas`, authHeader).catch(() => ({ data: {} })),
      fetchFromService(`${INVENTARIO_SERVICE_URL}/api/inventario/estadisticas`, authHeader).catch(() => ({ data: {} })),
      fetchFromService(`${CLIENTE_SERVICE_URL}/api/clientes/estadisticas`, authHeader).catch(() => ({ data: {} })),
      fetchFromService(`${COMPRA_SERVICE_URL}/api/compras/estadisticas`, authHeader).catch(() => ({ data: {} }))
    ]);

    // Procesar resumen para que sea más legible
    const resumen = {
      ventas: procesarResumenSeccion(ventas.data || {}),
      inventario: procesarResumenSeccion(inventario.data || {}),
      clientes: procesarResumenSeccion(clientes.data || {}),
      compras: procesarResumenSeccion(compras.data || {}),
      fecha_generacion: new Date().toLocaleString('es-ES')
    };

    const contenido = await generarContenidoReporte(resumen, formato, 'resumen_general');
    const archivo = guardarArchivoReporte(contenido, 'resumen_general', formato);

    const reporte = await Reporte.create({
      tipo: 'resumen_general',
      nombre: 'Resumen General del Negocio',
      descripcion: 'Resumen consolidado de todas las áreas',
      parametros: JSON.stringify({}),
      formato,
      ruta_archivo: archivo.ruta_archivo,
      usuario_id,
      tamanio_archivo: archivo.tamanio,
      estado: 'completado',
      fecha_completado: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Resumen general generado exitosamente',
      data: { reporte, contenido: resumen }
    });
  } catch (error) {
    console.error('Error en generarResumenGeneral:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor: ' + error.message });
  }
};

// Función para procesar secciones del resumen
function procesarResumenSeccion(data) {
  if (!data || typeof data !== 'object') return {};
  
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Si es un objeto anidado, aplanarlo con prefijo
      Object.entries(value).forEach(([subKey, subValue]) => {
        if (typeof subValue !== 'object' || subValue === null) {
          result[`${key}_${subKey}`] = subValue;
        }
      });
    } else if (!Array.isArray(value)) {
      result[key] = value;
    }
  });
  
  return Object.keys(result).length > 0 ? result : data;
}

// ============ FUNCIONES DE PROCESAMIENTO ============

function procesarVentasDiarias(ventas) {
  if (!ventas) return [];
  
  // Si ya es un array de objetos con las propiedades esperadas
  if (Array.isArray(ventas) && ventas.length > 0) {
    // Verificar si ya vienen procesadas (tienen fecha, total_ventas, etc.)
    if (ventas[0].fecha && (ventas[0].total_ventas !== undefined || ventas[0].total_monto !== undefined)) {
      return ventas;
    }
    
    // Procesar ventas crudas
    const dias = {};
    ventas.forEach(v => {
      const fecha = v.fecha_venta ? new Date(v.fecha_venta).toLocaleDateString('es-ES') : 
                    v.fecha ? new Date(v.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
      if (!dias[fecha]) {
        dias[fecha] = { 
          Fecha: fecha, 
          'Total Ventas': 0, 
          'Monto Total': 0, 
          'Productos Vendidos': 0 
        };
      }
      dias[fecha]['Total Ventas']++;
      dias[fecha]['Monto Total'] += parseFloat(v.total || v.monto || 0);
      if (v.detalles) {
        v.detalles.forEach(d => {
          dias[fecha]['Productos Vendidos'] += (d.cantidad || 0);
        });
      }
    });
    return Object.values(dias);
  }
  
  // Si es un objeto tipo {fecha: {total_ventas, ...}}
  if (typeof ventas === 'object' && !Array.isArray(ventas)) {
    return Object.entries(ventas).map(([fecha, datos]) => ({
      Fecha: fecha,
      'Total Ventas': datos.total_ventas || 0,
      'Monto Total': datos.total_monto || 0,
      'Productos Vendidos': datos.total_productos || 0
    }));
  }
  
  return [];
}

function procesarVentasMensuales(ventas) {
  if (!ventas) return [];
  
  const meses = {};
  ventas.forEach(v => {
    const fecha = new Date(v.fecha_venta || v.fecha);
    const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    if (!meses[mes]) {
      meses[mes] = { Mes: mes, 'Total Ventas': 0, 'Monto Total': 0 };
    }
    meses[mes]['Total Ventas']++;
    meses[mes]['Monto Total'] += parseFloat(v.total || v.monto || 0);
  });
  return Object.values(meses);
}

function procesarVentasPorSucursal(ventas) {
  if (!ventas) return [];
  const sucursales = {};
  ventas.forEach(v => {
    const key = v.sucursal_id || 'desconocido';
    if (!sucursales[key]) {
      sucursales[key] = { 
        Sucursal: getNombreSucursal(key), 
        'Total Ventas': 0, 
        'Monto Total': 0 
      };
    }
    sucursales[key]['Total Ventas']++;
    sucursales[key]['Monto Total'] += parseFloat(v.total || v.monto || 0);
  });
  return Object.values(sucursales);
}

function procesarVentasPorVendedor(ventas) {
  if (!ventas) return [];
  const vendedores = {};
  ventas.forEach(v => {
    const key = v.usuario_id || v.vendedor_id || 'desconocido';
    if (!vendedores[key]) {
      vendedores[key] = { 
        Vendedor: `ID: ${key}`, 
        'Total Ventas': 0, 
        'Monto Total': 0 
      };
    }
    vendedores[key]['Total Ventas']++;
    vendedores[key]['Monto Total'] += parseFloat(v.total || v.monto || 0);
  });
  return Object.values(vendedores);
}

function procesarRotacionInventario(ventas, productos) {
  if (!ventas || !productos) return [];
  const rotacion = {};
  ventas.forEach(v => {
    (v.detalles || []).forEach(d => {
      const pid = d.producto_id;
      if (!rotacion[pid]) {
        const producto = Array.isArray(productos) ? productos.find(p => p.id === pid) : null;
        rotacion[pid] = {
          Producto: getNombreProducto(pid),
          'Total Vendido': 0,
          'Monto Total': 0
        };
      }
      rotacion[pid]['Total Vendido'] += (d.cantidad || 0);
      rotacion[pid]['Monto Total'] += parseFloat(d.total || d.subtotal || 0);
    });
  });
  return Object.values(rotacion).sort((a, b) => b['Total Vendido'] - a['Total Vendido']);
}

function procesarComprasPorProveedor(compras) {
  if (!compras) return [];
  const proveedores = {};
  compras.forEach(c => {
    const key = c.proveedor_id || 'desconocido';
    if (!proveedores[key]) {
      proveedores[key] = {
        Proveedor: c.proveedor?.razon_social || c.proveedor?.nombre || `Proveedor ${key}`,
        'Total Compras': 0,
        'Monto Total': 0
      };
    }
    proveedores[key]['Total Compras']++;
    proveedores[key]['Monto Total'] += parseFloat(c.total || c.monto || 0);
  });
  return Object.values(proveedores).sort((a, b) => b['Monto Total'] - a['Monto Total']);
}

// ============ DESCARGA DE REPORTES ============

const descargarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    
    const reporte = await Reporte.findByPk(id);
    if (!reporte) {
      return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    }

    if (reporte.estado !== 'completado') {
      return res.status(400).json({ success: false, message: 'El reporte no está disponible para descargar' });
    }

    if (reporte.ruta_archivo) {
      const rutaCompleta = path.join(__dirname, '..', reporte.ruta_archivo);
      
      if (fs.existsSync(rutaCompleta)) {
        const mimeTypes = {
          pdf: 'application/pdf',
          excel: 'application/vnd.ms-excel',
          csv: 'text/csv',
          json: 'application/json'
        };
        
        const mimeType = mimeTypes[reporte.formato] || 'application/octet-stream';
        const extension = reporte.formato === 'excel' ? 'csv' : reporte.formato;
        const nombreArchivo = `reporte_${reporte.tipo}_${new Date().toISOString().split('T')[0]}.${extension}`;
        
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.setHeader('Content-Length', fs.statSync(rutaCompleta).size);
        
        const fileStream = fs.createReadStream(rutaCompleta);
        fileStream.pipe(res);
        return;
      }
    }

    // Si no hay archivo, generar uno nuevo
    const authHeader = req.headers.authorization;
    await refreshCache(authHeader);
    
    const parametros = JSON.parse(reporte.parametros || '{}');
    const contenido = await generarContenidoReporte(parametros, reporte.formato, reporte.tipo);
    
    const archivo = guardarArchivoReporte(contenido, reporte.tipo, reporte.formato);
    await reporte.update({ 
      ruta_archivo: archivo.ruta_archivo,
      tamanio_archivo: archivo.tamanio 
    });
    
    const mimeTypes = {
      pdf: 'application/pdf',
      excel: 'text/csv',
      csv: 'text/csv',
      json: 'application/json'
    };
    
    const extension = reporte.formato === 'excel' ? 'csv' : reporte.formato;
    const nombreArchivo = `reporte_${reporte.tipo}_${new Date().toISOString().split('T')[0]}.${extension}`;
    
    res.setHeader('Content-Type', mimeTypes[reporte.formato] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    
    if (Buffer.isBuffer(contenido)) {
      res.send(contenido);
    } else {
      res.send(contenido);
    }
    
  } catch (error) {
    console.error('Error en descargarReporte:', error);
    res.status(500).json({ success: false, message: 'Error al descargar el reporte: ' + error.message });
  }
};

// ============ REPORTES GUARDADOS ============

const getReportes = async (req, res) => {
  try {
    const { tipo, estado, fecha_inicio, fecha_fin, usuario_id } = req.query;
    let where = {};
    if (tipo) where.tipo = tipo;
    if (estado) where.estado = estado;
    if (usuario_id) where.usuario_id = usuario_id;
    if (fecha_inicio && fecha_fin) {
      where.fecha_generacion = { [Op.between]: [new Date(fecha_inicio), new Date(fecha_fin)] };
    }
    const reportes = await Reporte.findAll({ where, order: [['fecha_generacion', 'DESC']] });
    res.json({ success: true, data: reportes });
  } catch (error) {
    console.error('Error en getReportes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const getReporteById = async (req, res) => {
  try {
    const reporte = await Reporte.findByPk(req.params.id);
    if (!reporte) return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    res.json({ success: true, data: reporte });
  } catch (error) {
    console.error('Error en getReporteById:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const deleteReporte = async (req, res) => {
  try {
    const reporte = await Reporte.findByPk(req.params.id);
    if (!reporte) return res.status(404).json({ success: false, message: 'Reporte no encontrado' });
    if (reporte.ruta_archivo) {
      const rutaCompleta = path.join(__dirname, '..', reporte.ruta_archivo);
      if (fs.existsSync(rutaCompleta)) fs.unlinkSync(rutaCompleta);
    }
    await reporte.destroy();
    res.json({ success: true, message: 'Reporte eliminado exitosamente' });
  } catch (error) {
    console.error('Error en deleteReporte:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

// ============ ALERTAS ============

const getAlertas = async (req, res) => {
  try {
    const { tipo, nivel, estado, sucursal_id, leida } = req.query;
    let where = {};
    if (tipo) where.tipo = tipo;
    if (nivel) where.nivel = nivel;
    if (estado) where.estado = estado;
    if (sucursal_id) where.sucursal_id = sucursal_id;
    if (leida !== undefined) where.leida = leida === 'true';
    const alertas = await Alerta.findAll({ where, order: [['leida', 'ASC'], ['fecha_creacion', 'DESC']] });
    res.json({ success: true, data: alertas });
  } catch (error) {
    console.error('Error en getAlertas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const getAlertaById = async (req, res) => {
  try {
    const alerta = await Alerta.findByPk(req.params.id);
    if (!alerta) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    res.json({ success: true, data: alerta });
  } catch (error) {
    console.error('Error en getAlertaById:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const createAlerta = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
    
    const { tipo, nivel, titulo, mensaje, datos, sucursal_id, usuario_id } = req.body;
    const alerta = await Alerta.create({
      tipo, nivel: nivel || 'info', titulo, mensaje,
      datos: datos ? JSON.stringify(datos) : null,
      sucursal_id, usuario_id, leida: false, estado: 'activa'
    });
    res.status(201).json({ success: true, message: 'Alerta creada exitosamente', data: alerta });
  } catch (error) {
    console.error('Error en createAlerta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const marcarAlertaLeida = async (req, res) => {
  try {
    const alerta = await Alerta.findByPk(req.params.id);
    if (!alerta) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    await alerta.update({ leida: true, fecha_lectura: new Date() });
    res.json({ success: true, message: 'Alerta marcada como leída', data: alerta });
  } catch (error) {
    console.error('Error en marcarAlertaLeida:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const resolverAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.findByPk(req.params.id);
    if (!alerta) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    await alerta.update({ estado: 'resuelta', fecha_resolucion: new Date() });
    res.json({ success: true, message: 'Alerta resuelta exitosamente', data: alerta });
  } catch (error) {
    console.error('Error en resolverAlerta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const ignorarAlerta = async (req, res) => {
  try {
    const alerta = await Alerta.findByPk(req.params.id);
    if (!alerta) return res.status(404).json({ success: false, message: 'Alerta no encontrada' });
    await alerta.update({ estado: 'ignorada' });
    res.json({ success: true, message: 'Alerta ignorada', data: alerta });
  } catch (error) {
    console.error('Error en ignorarAlerta:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const getAlertasNoLeidas = async (req, res) => {
  try {
    const { sucursal_id } = req.query;
    let where = { leida: false, estado: 'activa' };
    if (sucursal_id) where.sucursal_id = sucursal_id;
    const alertas = await Alerta.findAll({ where, order: [['nivel', 'DESC'], ['fecha_creacion', 'DESC']] });
    res.json({ success: true, data: alertas, total: alertas.length });
  } catch (error) {
    console.error('Error en getAlertasNoLeidas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

const getEstadisticas = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const totalReportes = await Reporte.count();
    const reportesCompletados = await Reporte.count({ where: { estado: 'completado' } });
    const reportesFallidos = await Reporte.count({ where: { estado: 'fallido' } });
    const tiposReporte = await Reporte.findAll({
      attributes: ['tipo', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      group: ['tipo']
    });
    const alertasActivas = await Alerta.count({ where: { estado: 'activa', leida: false } });
    const alertasPorNivel = await Alerta.findAll({
      attributes: ['nivel', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      where: { estado: 'activa' },
      group: ['nivel']
    });
    res.json({
      success: true,
      data: { total_reportes: totalReportes, reportes_completados: reportesCompletados, reportes_fallidos: reportesFallidos, tipos_reporte: tiposReporte, alertas_activas: alertasActivas, alertas_por_nivel: alertasPorNivel }
    });
  } catch (error) {
    console.error('Error en getEstadisticas:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = {
  generarReporteVentas,
  generarReporteInventario,
  generarReporteClientes,
  generarReporteCompras,
  generarResumenGeneral,
  getReportes,
  getReporteById,
  deleteReporte,
  descargarReporte,
  getAlertas,
  getAlertaById,
  createAlerta,
  marcarAlertaLeida,
  resolverAlerta,
  ignorarAlerta,
  getAlertasNoLeidas,
  getEstadisticas
};