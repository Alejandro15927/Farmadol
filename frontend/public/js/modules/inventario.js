// public/js/modules/inventario.js
const InventarioModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Inventario</h2>
                <button class="btn btn-primary" onclick="window.InventarioModule?.showCreate()">
                    <span class="material-symbols-outlined text-sm">add</span>
                    Nuevo Producto
                </button>
            </div>
            <div id="inventarioContent">
                <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
            </div>
        `;
        this.loadProductos();
    },
    
    loadProductos: async function() {
        try {
            const container = document.getElementById('inventarioContent');
            if (!container) return;
            
            const data = await apiRequest('/api/inventario/productos');
            
            if (!data.data || data.data.length === 0) {
                container.innerHTML = `
                    <div class="bg-gray-50 rounded-xl p-8 text-center">
                        <span class="material-symbols-outlined text-gray-400 text-5xl">inventory_2</span>
                        <p class="text-gray-500 mt-2">No hay productos registrados</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nombre</th>
                                <th>Categoría</th>
                                <th>Precio Venta</th>
                                <th>Stock</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            data.data.forEach(p => {
                const estadoBadge = p.estado 
                    ? '<span class="badge badge-success">Activo</span>' 
                    : '<span class="badge badge-danger">Inactivo</span>';
                
                const stockTotal = p.inventario?.reduce((sum, i) => sum + i.cantidad, 0) || 0;
                
                html += `
                    <tr>
                        <td><span class="font-mono text-sm">${p.codigo}</span></td>
                        <td><strong>${p.nombre}</strong></td>
                        <td>${p.categoria?.nombre || 'N/A'}</td>
                        <td>S/ ${parseFloat(p.precio_venta).toFixed(2)}</td>
                        <td class="text-center">${stockTotal}</td>
                        <td>${estadoBadge}</td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading inventario:', error);
            const container = document.getElementById('inventarioContent');
            if (container) {
                container.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                        <p class="text-red-700 mt-2">Error al cargar inventario</p>
                        <p class="text-sm text-red-600">${error.message}</p>
                    </div>
                `;
            }
        }
    },
    
    showCreate: function() {
        showModal('Nuevo Producto', `
            <div class="text-center text-gray-500 p-4">
                <span class="material-symbols-outlined text-4xl">construction</span>
                <p class="mt-2">Función en desarrollo</p>
            </div>
        `);
    }
};

window.InventarioModule = InventarioModule;