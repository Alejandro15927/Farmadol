// public/js/modules/reportes.js
const ReportesModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Reportes</h2>
            </div>
            <div id="reportesContent">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div class="stat-card cursor-pointer hover:shadow-md transition-all" onclick="window.ReportesModule?.generarReporte('ventas-diarias')">
                        <div class="flex items-center gap-3">
                            <div class="stat-icon bg-blue-50 text-blue-600">
                                <span class="material-symbols-outlined">trending_up</span>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-700">Ventas Diarias</h4>
                                <p class="text-sm text-gray-500">Reporte de ventas del día</p>
                            </div>
                        </div>
                    </div>
                    <div class="stat-card cursor-pointer hover:shadow-md transition-all" onclick="window.ReportesModule?.generarReporte('productos-mas-vendidos')">
                        <div class="flex items-center gap-3">
                            <div class="stat-icon bg-green-50 text-green-600">
                                <span class="material-symbols-outlined">local_fire_department</span>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-700">Productos Más Vendidos</h4>
                                <p class="text-sm text-gray-500">Top productos más vendidos</p>
                            </div>
                        </div>
                    </div>
                    <div class="stat-card cursor-pointer hover:shadow-md transition-all" onclick="window.ReportesModule?.generarReporte('stock-bajo')">
                        <div class="flex items-center gap-3">
                            <div class="stat-icon bg-yellow-50 text-yellow-600">
                                <span class="material-symbols-outlined">warning</span>
                            </div>
                            <div>
                                <h4 class="font-semibold text-gray-700">Stock Bajo</h4>
                                <p class="text-sm text-gray-500">Productos con stock crítico</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="reportesList">
                    <h3 class="text-lg font-semibold text-gray-700 mb-4">Reportes Generados</h3>
                    <div class="text-center text-gray-500 p-8 bg-gray-50 rounded-xl">
                        <span class="material-symbols-outlined text-4xl">assessment</span>
                        <p class="mt-2">Genera un reporte desde los botones superiores</p>
                    </div>
                </div>
            </div>
        `;
        this.loadReportes();
    },
    
    loadReportes: async function() {
        try {
            const container = document.getElementById('reportesList');
            if (!container) return;
            
            const data = await apiRequest('/api/reportes/reportes?limit=10');
            
            if (!data.data || data.data.length === 0) {
                return;
            }

            let html = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Formato</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            data.data.forEach(r => {
                const estadoBadge = r.estado === 'completado' 
                    ? '<span class="badge badge-success">Completado</span>' 
                    : '<span class="badge badge-warning">Generando</span>';
                
                html += `
                    <tr>
                        <td>${r.nombre}</td>
                        <td>${r.tipo.replace('_', ' ')}</td>
                        <td>${r.formato.toUpperCase()}</td>
                        <td>${estadoBadge}</td>
                        <td>${new Date(r.fecha_generacion).toLocaleDateString()}</td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (error) {
            console.warn('Error loading reportes:', error);
        }
    },
    
    generarReporte: function(tipo) {
        showModal('Generar Reporte', `
            <div class="text-center p-4">
                <span class="material-symbols-outlined text-4xl text-blue-500">description</span>
                <p class="text-gray-700 mt-2">Generando reporte de ${tipo.replace('-', ' ')}...</p>
                <p class="text-sm text-gray-500 mt-1">Esto puede tomar unos segundos</p>
                <button class="btn btn-primary mt-4" onclick="window.closeModal()">Cerrar</button>
            </div>
        `);
        
        // Simular generación
        setTimeout(() => {
            window.closeModal();
            showToast('✅ Reporte generado exitosamente', 'success');
            this.loadReportes();
        }, 2000);
    }
};

window.ReportesModule = ReportesModule;