// public/js/modules/ventas.js
const VentasModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Ventas</h2>
                <button class="btn btn-primary" onclick="window.VentasModule?.showCreate()">
                    <span class="material-symbols-outlined text-sm">add</span>
                    Nueva Venta
                </button>
            </div>
            <div id="ventasContent">
                <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
            </div>
        `;
        this.loadVentas();
    },
    
    loadVentas: async function() {
        try {
            const container = document.getElementById('ventasContent');
            if (!container) return;
            
            // Usar la misma función apiRequest que funciona en sucursales.html
            const data = await apiRequest('/api/ventas/ventas');
            
            if (!data.data || data.data.length === 0) {
                container.innerHTML = `
                    <div class="bg-gray-50 rounded-xl p-8 text-center">
                        <span class="material-symbols-outlined text-gray-400 text-5xl">receipt_long</span>
                        <p class="text-gray-500 mt-2">No hay ventas registradas</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>N° Venta</th>
                                <th>Cliente</th>
                                <th>Método Pago</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            data.data.forEach(v => {
                const estadoBadge = v.estado === 'completada' 
                    ? '<span class="badge badge-success">Completada</span>' 
                    : '<span class="badge badge-danger">Anulada</span>';
                
                html += `
                    <tr>
                        <td><span class="font-mono text-sm">${v.numero_venta}</span></td>
                        <td>${v.cliente ? `${v.cliente.nombres} ${v.cliente.apellidos}` : 'Cliente General'}</td>
                        <td>${v.metodo_pago?.nombre || 'N/A'}</td>
                        <td class="font-bold">S/ ${parseFloat(v.total).toFixed(2)}</td>
                        <td>${estadoBadge}</td>
                        <td>${new Date(v.fecha_venta).toLocaleDateString()}</td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading ventas:', error);
            const container = document.getElementById('ventasContent');
            if (container) {
                container.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                        <p class="text-red-700 mt-2">Error al cargar ventas</p>
                        <p class="text-sm text-red-600">${error.message}</p>
                    </div>
                `;
            }
        }
    },
    
    showCreate: function() {
        showModal('Nueva Venta', `
            <div class="text-center text-gray-500 p-4">
                <span class="material-symbols-outlined text-4xl">construction</span>
                <p class="mt-2">Función en desarrollo</p>
            </div>
        `);
    }
};

window.VentasModule = VentasModule;