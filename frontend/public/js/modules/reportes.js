// Módulo de Reportes
const ReportesModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Reportes</h2>
            </div>
            <div id="reportesContent">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    ${this.getReporteCards()}
                </div>
                <div id="reportesList">
                    <h3 class="text-lg font-semibold text-gray-700 mb-4">Reportes Generados</h3>
                    <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
                </div>
            </div>
        `;
        this.loadReportes();
    },
    
    getReporteCards: function() {
        const reportes = [
            { id: 'ventas-diarias', icon: 'trending_up', title: 'Ventas Diarias', desc: 'Reporte de ventas del día' },
            { id: 'productos-mas-vendidos', icon: 'local_fire_department', title: 'Productos Más Vendidos', desc: 'Top productos más vendidos' },
            { id: 'stock-bajo', icon: 'warning', title: 'Stock Bajo', desc: 'Productos con stock crítico' },
            { id: 'proximos-vencer', icon: 'event', title: 'Próximos a Vencer', desc: 'Productos por vencer' },
            { id: 'clientes-frecuentes', icon: 'people', title: 'Clientes Frecuentes', desc: 'Clientes con más compras' }
        ];
        
        return reportes.map(r => `
            <div class="stat-card cursor-pointer hover:shadow-md transition-all" onclick="ReportesModule.generarReporte('${r.id}')">
                <div class="flex items-center gap-3">
                    <div class="stat-icon bg-blue-50 text-blue-600">
                        <span class="material-symbols-outlined">${r.icon}</span>
                    </div>
                    <div>
                        <h4 class="font-semibold text-gray-700">${r.title}</h4>
                        <p class="text-sm text-gray-500">${r.desc}</p>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    loadReportes: async function() {
        try {
            const data = await apiRequest('/api/reportes/reportes?limit=10');
            const container = document.getElementById('reportesList');
            
            const headers = ['Nombre', 'Tipo', 'Formato', 'Registros', 'Estado', 'Fecha'];
            const actions = (row) => `
                ${row.estado === 'completado' ? `<button class="btn btn-primary btn-sm" onclick="ReportesModule.descargar(${row.id})">
                    <span class="material-symbols-outlined text-sm">download</span>
                </button>` : ''}
                <button class="btn btn-secondary btn-sm" onclick="ReportesModule.view(${row.id})">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                </button>
            `;
            
            const formattedData = (data.data || []).map(r => ({
                id: r.id,
                nombre: r.nombre,
                tipo: r.tipo.replace('_', ' '),
                formato: r.formato.toUpperCase(),
                total_registros: r.total_registros,
                estado: `<span class="badge ${r.estado === 'completado' ? 'badge-success' : r.estado === 'generando' ? 'badge-warning' : 'badge-danger'}">${r.estado}</span>`,
                fecha_generacion: new Date(r.fecha_generacion).toLocaleString()
            }));
            
            container.innerHTML = createTable(headers, formattedData, actions);
        } catch (error) {
            document.getElementById('reportesList').innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    <p class="text-red-700 mt-2">Error al cargar reportes</p>
                    <p class="text-sm text-red-600">${error.message}</p>
                </div>
            `;
        }
    },
    
    generarReporte: async function(tipo) {
        const params = this.getReporteParams(tipo);
        if (!params) return;
        
        try {
            const response = await apiRequest(`/api/reportes/reportes/${tipo}`, {
                method: 'POST',
                body: JSON.stringify(params)
            });
            showAlert('Reporte generado exitosamente', 'success');
            this.loadReportes();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    },
    
    getReporteParams: function(tipo) {
        const params = {
            formato: 'json'
        };
        
        switch(tipo) {
            case 'ventas-diarias':
                const fecha = prompt('Ingrese la fecha (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                if (!fecha) return null;
                params.fecha = fecha;
                break;
            case 'productos-mas-vendidos':
                const inicio = prompt('Fecha inicio (YYYY-MM-DD):', '2026-01-01');
                if (!inicio) return null;
                const fin = prompt('Fecha fin (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
                if (!fin) return null;
                params.fecha_inicio = inicio;
                params.fecha_fin = fin;
                params.limit = 10;
                break;
            case 'stock-bajo':
                params.sucursal_id = prompt('ID de sucursal (opcional):') || null;
                break;
            case 'proximos-vencer':
                params.dias = parseInt(prompt('Días de anticipación (30):') || 30);
                params.sucursal_id = prompt('ID de sucursal (opcional):') || null;
                break;
            case 'clientes-frecuentes':
                params.limit = parseInt(prompt('Cantidad de clientes (10):') || 10);
                params.min_compras = parseInt(prompt('Mínimo de compras (3):') || 3);
                break;
            default:
                return null;
        }
        
        return params;
    },
    
    descargar: async function(id) {
        window.open(`${getApiBase()}/api/reportes/reportes/${id}/descargar`, '_blank');
    },
    
    view: function(id) {
        showModal('Detalle de Reporte', `
            <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
        `);
    }
};

window.ReportesModule = ReportesModule;