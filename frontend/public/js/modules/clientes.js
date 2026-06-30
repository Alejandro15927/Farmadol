// public/js/modules/clientes.js
const ClientesModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Clientes</h2>
                <button class="btn btn-primary" onclick="window.ClientesModule?.showCreate()">
                    <span class="material-symbols-outlined text-sm">person_add</span>
                    Nuevo Cliente
                </button>
            </div>
            <div id="clientesContent">
                <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
            </div>
        `;
        this.loadClientes();
    },
    
    loadClientes: async function() {
        try {
            const container = document.getElementById('clientesContent');
            if (!container) return;
            
            const data = await apiRequest('/api/clientes/clientes');
            
            if (!data.data || data.data.length === 0) {
                container.innerHTML = `
                    <div class="bg-gray-50 rounded-xl p-8 text-center">
                        <span class="material-symbols-outlined text-gray-400 text-5xl">people</span>
                        <p class="text-gray-500 mt-2">No hay clientes registrados</p>
                    </div>
                `;
                return;
            }

            let html = `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Documento</th>
                                <th>Nombres</th>
                                <th>Apellidos</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Nivel</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            data.data.forEach(c => {
                const nivelColors = {
                    'bronce': 'badge-warning',
                    'plata': 'badge-info',
                    'oro': 'badge-success',
                    'platino': 'badge-primary',
                    'diamante': 'badge-purple'
                };
                const nivelBadge = `<span class="badge ${nivelColors[c.nivel] || 'badge-info'}">${c.nivel || 'bronce'}</span>`;
                
                html += `
                    <tr>
                        <td><span class="font-mono text-sm">${c.numero_documento}</span></td>
                        <td><strong>${c.nombres || ''}</strong></td>
                        <td>${c.apellidos || ''}</td>
                        <td class="max-w-xs truncate">${c.email || 'N/A'}</td>
                        <td>${c.telefono || 'N/A'}</td>
                        <td>${nivelBadge}</td>
                    </tr>
                `;
            });

            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (error) {
            console.error('Error loading clientes:', error);
            const container = document.getElementById('clientesContent');
            if (container) {
                container.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                        <p class="text-red-700 mt-2">Error al cargar clientes</p>
                        <p class="text-sm text-red-600">${error.message}</p>
                    </div>
                `;
            }
        }
    },
    
    showCreate: function() {
        showModal('Nuevo Cliente', `
            <div class="text-center text-gray-500 p-4">
                <span class="material-symbols-outlined text-4xl">construction</span>
                <p class="mt-2">Función en desarrollo</p>
            </div>
        `);
    }
};

window.ClientesModule = ClientesModule;