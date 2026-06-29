// Módulo Dashboard - Versión simplificada sin problemas de contexto
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
        `;
        
        // Usar setTimeout para asegurar que el DOM esté listo
        setTimeout(() => {
            DashboardModule.loadStats();
            DashboardModule.loadRecentSales();
            DashboardModule.loadStockAlerts();
        }, 100);
    },
    
    loadStats: async function() {
        try {
            let ventasData = { data: { resumen: { total_ventas: 0, total_monto: 0 } } };
            let clientesData = { data: { clientes_activos: 0 } };
            let stockData = { data: [] };
            
            try {
                const response = await apiRequest('/api/ventas/ventas/dia/resumen');
                ventasData = response;
            } catch (e) {
                console.warn('Error loading ventas:', e.message);
            }
            
            try {
                const response = await apiRequest('/api/clientes/clientes/estadisticas');
                clientesData = response;
            } catch (e) {
                console.warn('Error loading clientes:', e.message);
            }
            
            try {
                const response = await apiRequest('/api/inventario/stock-bajo');
                stockData = response;
            } catch (e) {
                console.warn('Error loading stock:', e.message);
            }
            
            const stats = [
                { icon: 'shopping_cart', label: 'Ventas Hoy', value: ventasData.data?.resumen?.total_ventas || 0, color: 'blue' },
                { icon: 'payments', label: 'Monto Hoy', value: `S/ ${(ventasData.data?.resumen?.total_monto || 0).toFixed(2)}`, color: 'green' },
                { icon: 'people', label: 'Clientes Activos', value: clientesData.data?.clientes_activos || 0, color: 'purple' },
                { icon: 'inventory_2', label: 'Productos Bajos', value: stockData.data?.length || 0, color: 'yellow' }
            ];
            
            const grid = document.getElementById('statsGrid');
            if (grid) {
                grid.innerHTML = stats.map(s => 
                    createStatCard(s.icon, s.label, s.value, s.color)
                ).join('');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
            const grid = document.getElementById('statsGrid');
            if (grid) {
                grid.innerHTML = `
                    <div class="col-span-4 bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                        <p class="text-red-700 mt-2">Error al cargar estadísticas</p>
                        <p class="text-sm text-red-600">${error.message}</p>
                    </div>
                `;
            }
        }
    },
    
    loadRecentSales: async function() {
        try {
            const data = await apiRequest('/api/ventas/ventas?limit=5');
            const container = document.getElementById('recentSales');
            
            if (!container) return;
            
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
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading recent sales:', error);
            const container = document.getElementById('recentSales');
            if (container) {
                container.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <span class="material-symbols-outlined text-red-500">error</span>
                        <p class="text-red-700 mt-2">Error al cargar ventas recientes</p>
                    </div>
                `;
            }
        }
    },
    
    loadStockAlerts: async function() {
        try {
            const data = await apiRequest('/api/reportes/alertas?estado=activa&limit=5');
            const container = document.getElementById('stockAlerts');
            
            if (!container) return;
            
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
            console.error('Error loading stock alerts:', error);
            const container = document.getElementById('stockAlerts');
            if (container) {
                container.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <span class="material-symbols-outlined text-red-500">error</span>
                        <p class="text-red-700 mt-2">Error al cargar alertas</p>
                    </div>
                `;
            }
        }
    }
};

// Registrar módulo
window.DashboardModule = DashboardModule;