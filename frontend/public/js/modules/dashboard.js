// public/js/modules/dashboard.js
const DashboardModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="statsGrid">
                <div class="col-span-4">
                    <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando estadísticas...</div>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div id="recentSales">
                    <h3 class="text-lg font-semibold text-gray-700 mb-4">Últimas Ventas</h3>
                    <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
                </div>
                <div id="stockAlerts">
                    <h3 class="text-lg font-semibold text-gray-700 mb-4">Alertas de Stock</h3>
                    <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
                </div>
            </div>
            <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p class="text-sm text-yellow-700">
                    <span class="material-symbols-outlined text-sm align-middle">info</span>
                    Inicia los servicios para ver datos completos: Ventas (3005), Inventario (3004), Clientes (3006), Reportes (3007)
                </p>
            </div>
        `;
        
        setTimeout(() => {
            DashboardModule.loadStats();
            DashboardModule.loadRecentSales();
            DashboardModule.loadStockAlerts();
        }, 100);
    },
    
    loadStats: async function() {
        try {
            let ventasData = { data: { resumen: { total_ventas: 'N/A', total_monto: 'N/A' } } };
            let clientesData = { data: { clientes_activos: 'N/A' } };
            let stockData = { data: [] };
            
            try {
                const response = await apiRequest('/api/ventas/ventas/dia/resumen');
                ventasData = response;
            } catch (e) {
                console.warn('⚠️ Servicio de ventas no disponible:', e.message);
            }
            
            try {
                const response = await apiRequest('/api/clientes/clientes/estadisticas');
                clientesData = response;
            } catch (e) {
                console.warn('⚠️ Servicio de clientes no disponible:', e.message);
            }
            
            try {
                const response = await apiRequest('/api/inventario/stock-bajo');
                stockData = response;
            } catch (e) {
                console.warn('⚠️ Servicio de inventario no disponible:', e.message);
            }
            
            const stats = [
                { icon: 'shopping_cart', label: 'Ventas Hoy', value: ventasData.data?.resumen?.total_ventas || 'N/A', color: 'blue' },
                { icon: 'payments', label: 'Monto Hoy', value: ventasData.data?.resumen?.total_monto ? `S/ ${ventasData.data.resumen.total_monto.toFixed(2)}` : 'N/A', color: 'green' },
                { icon: 'people', label: 'Clientes Activos', value: clientesData.data?.clientes_activos || 'N/A', color: 'purple' },
                { icon: 'inventory_2', label: 'Stock Bajo', value: stockData.data?.length || 'N/A', color: 'yellow' }
            ];
            
            const grid = document.getElementById('statsGrid');
            if (grid) {
                grid.innerHTML = stats.map(s => createStatCard(s.icon, s.label, s.value, s.color)).join('');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },
    
    loadRecentSales: async function() {
        const container = document.getElementById('recentSales');
        if (!container) return;
        
        try {
            const data = await apiRequest('/api/ventas/ventas?limit=5');
            
            if (data.data && data.data.length > 0) {
                const ventas = data.data.map(v => ({
                    numero: v.numero_venta,
                    cliente: v.cliente ? `${v.cliente.nombres} ${v.cliente.apellidos}` : 'General',
                    total: `S/ ${v.total}`,
                    fecha: new Date(v.fecha_venta).toLocaleDateString()
                }));
                
                container.innerHTML = `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>N° Venta</th>
                                    <th>Cliente</th>
                                    <th>Total</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ventas.map(v => `
                                    <tr>
                                        <td>${v.numero}</td>
                                        <td>${v.cliente}</td>
                                        <td>${v.total}</td>
                                        <td>${v.fecha}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                        <span class="material-symbols-outlined text-4xl">receipt_long</span>
                        <p class="mt-2">No hay ventas recientes</p>
                        <p class="text-xs text-gray-400">(Inicia ventas-service en el puerto 3005)</p>
                    </div>
                `;
            }
        } catch (error) {
            console.warn('⚠️ Servicio de ventas no disponible:', error.message);
            container.innerHTML = `
                <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-yellow-500 text-4xl">info</span>
                    <p class="text-yellow-700 mt-2">Servicio de ventas no disponible</p>
                    <p class="text-sm text-yellow-600">Inicia ventas-service (puerto 3005)</p>
                </div>
            `;
        }
    },
    
    loadStockAlerts: async function() {
        const container = document.getElementById('stockAlerts');
        if (!container) return;
        
        try {
            const data = await apiRequest('/api/reportes/alertas?estado=activa&limit=5');
            
            if (data.data && data.data.length > 0) {
                const alertas = data.data.map(a => ({
                    titulo: a.titulo,
                    mensaje: a.mensaje,
                    nivel: a.nivel || 'info',
                    fecha: new Date(a.fecha_creacion).toLocaleDateString()
                }));
                
                container.innerHTML = `
                    <div class="space-y-2">
                        ${alertas.map(a => `
                            <div class="p-4 rounded-lg border ${a.nivel === 'critical' ? 'border-red-200 bg-red-50' : a.nivel === 'warning' ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}">
                                <div class="flex items-start gap-3">
                                    <span class="material-symbols-outlined ${a.nivel === 'critical' ? 'text-red-500' : a.nivel === 'warning' ? 'text-yellow-500' : 'text-blue-500'}">
                                        ${a.nivel === 'critical' ? 'error' : a.nivel === 'warning' ? 'warning' : 'info'}
                                    </span>
                                    <div class="flex-1">
                                        <p class="font-semibold text-gray-700">${a.titulo}</p>
                                        <p class="text-sm text-gray-600">${a.mensaje}</p>
                                        <p class="text-xs text-gray-500 mt-1">${a.fecha}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                        <span class="material-symbols-outlined text-4xl">check_circle</span>
                        <p class="mt-2">No hay alertas activas</p>
                    </div>
                `;
            }
        } catch (error) {
            console.warn('⚠️ Servicio de reportes no disponible:', error.message);
            container.innerHTML = `
                <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-yellow-500 text-4xl">info</span>
                    <p class="text-yellow-700 mt-2">Servicio de reportes no disponible</p>
                    <p class="text-sm text-yellow-600">Inicia reportes-service (puerto 3007)</p>
                </div>
            `;
        }
    }
};

window.DashboardModule = DashboardModule;
console.log('✅ DashboardModule cargado');