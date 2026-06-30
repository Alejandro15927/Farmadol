// public/js/modules/sucursales.js
// Módulo de Sucursales para el Dashboard

const SucursalesModule = {
    // Variable para almacenar los datos
    _sucursalesData: [],
    _transferenciasData: [],

    render: function(container) {
        // Guardar referencia al módulo
        const self = this;
        
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Sucursales</h2>
                <button class="btn btn-primary" onclick="SucursalesModule.showCreate()">
                    <span class="material-symbols-outlined text-sm">add_business</span>
                    Nueva Sucursal
                </button>
            </div>
            <div id="sucursalesContent">
                <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
            </div>
            <div class="mt-8">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-700">Transferencias entre Sucursales</h3>
                    <button class="btn btn-primary btn-sm" onclick="SucursalesModule.showCreateTransferencia()">
                        <span class="material-symbols-outlined text-sm">swap_horiz</span>
                        Nueva Transferencia
                    </button>
                </div>
                <div id="transferenciasContent">
                    <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
                </div>
            </div>
        `;
        
        // Cargar datos usando setTimeout para asegurar que el DOM esté listo
        setTimeout(() => {
            SucursalesModule.loadSucursales();
            SucursalesModule.loadTransferencias();
        }, 100);
    },
    
    loadSucursales: async function() {
        const container = document.getElementById('sucursalesContent');
        if (!container) return;
        
        container.innerHTML = `<div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando sucursales...</div>`;

        try {
            const data = await apiRequest('/api/sucursales/sucursales');
            this._sucursalesData = data.data || [];
            this.renderSucursales(this._sucursalesData);
        } catch (error) {
            console.error('Error loading sucursales:', error);
            container.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    <p class="text-red-700 mt-2">Error al cargar sucursales</p>
                    <p class="text-sm text-red-600">${error.message}</p>
                    <button onclick="SucursalesModule.loadSucursales()" class="btn btn-primary mt-4">Reintentar</button>
                </div>
            `;
        }
    },
    
    renderSucursales: function(data) {
        const container = document.getElementById('sucursalesContent');
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="bg-gray-50 rounded-xl p-8 text-center">
                    <span class="material-symbols-outlined text-gray-400 text-5xl">storefront</span>
                    <p class="text-gray-500 mt-2">No hay sucursales registradas</p>
                    <button onclick="SucursalesModule.showCreate()" class="btn btn-primary mt-4">
                        Crear primera sucursal
                    </button>
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
                            <th>Dirección</th>
                            <th>Teléfono</th>
                            <th>Email</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(s => {
            const estadoBadge = s.estado 
                ? '<span class="badge badge-success">Activo</span>' 
                : '<span class="badge badge-danger">Inactivo</span>';
            
            html += `
                <tr>
                    <td><span class="font-mono text-sm">${s.codigo || 'N/A'}</span></td>
                    <td><strong>${s.nombre}</strong></td>
                    <td class="max-w-xs truncate">${s.direccion || 'N/A'}</td>
                    <td>${s.telefono || 'N/A'}</td>
                    <td>${s.email || 'N/A'}</td>
                    <td>${estadoBadge}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="SucursalesModule.showEdit(${s.id})">
                            <span class="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button class="btn ${s.estado ? 'btn-danger' : 'btn-success'} btn-sm" onclick="SucursalesModule.toggleStatus(${s.id})">
                            <span class="material-symbols-outlined text-sm">${s.estado ? 'block' : 'check_circle'}</span>
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    },
    
    // ============ TRANSFERENCIAS ============
    loadTransferencias: async function() {
        const container = document.getElementById('transferenciasContent');
        if (!container) return;
        
        container.innerHTML = `<div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando transferencias...</div>`;

        try {
            const data = await apiRequest('/api/sucursales/transferencias');
            this._transferenciasData = data.data || [];
            this.renderTransferencias(this._transferenciasData);
        } catch (error) {
            console.error('Error loading transferencias:', error);
            container.innerHTML = `
                <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-yellow-500 text-4xl">info</span>
                    <p class="text-yellow-700 mt-2">Error al cargar transferencias</p>
                    <p class="text-sm text-yellow-600">${error.message}</p>
                    <button onclick="SucursalesModule.loadTransferencias()" class="btn btn-primary mt-4">Reintentar</button>
                </div>
            `;
        }
    },
    
    renderTransferencias: function(data) {
        const container = document.getElementById('transferenciasContent');
        if (!container) return;
        
        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="bg-gray-50 rounded-xl p-6 text-center text-gray-500">
                    <span class="material-symbols-outlined text-4xl">swap_horiz</span>
                    <p class="mt-2">No hay transferencias registradas</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Origen</th>
                            <th>Destino</th>
                            <th>Cantidad</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(t => {
            const estadoColors = {
                'pendiente': 'badge-warning',
                'en_proceso': 'badge-info',
                'completada': 'badge-success',
                'cancelada': 'badge-danger'
            };
            const estadoBadge = `<span class="badge ${estadoColors[t.estado] || 'badge-info'}">${t.estado}</span>`;
            
            html += `
                <tr>
                    <td>${t.id}</td>
                    <td>${t.origen?.nombre || t.sucursal_origen_id}</td>
                    <td>${t.destino?.nombre || t.sucursal_destino_id}</td>
                    <td>${t.cantidad}</td>
                    <td>${estadoBadge}</td>
                    <td>${new Date(t.fecha_solicitud).toLocaleDateString()}</td>
                    <td>
                        ${t.estado === 'pendiente' ? `
                            <button class="btn btn-success btn-sm" onclick="SucursalesModule.autorizarTransferencia(${t.id})">
                                <span class="material-symbols-outlined text-sm">check</span>
                            </button>
                        ` : ''}
                        ${t.estado === 'en_proceso' ? `
                            <button class="btn btn-primary btn-sm" onclick="SucursalesModule.completarTransferencia(${t.id})">
                                <span class="material-symbols-outlined text-sm">done_all</span>
                            </button>
                        ` : ''}
                        ${t.estado === 'pendiente' || t.estado === 'en_proceso' ? `
                            <button class="btn btn-danger btn-sm" onclick="SucursalesModule.cancelarTransferencia(${t.id})">
                                <span class="material-symbols-outlined text-sm">close</span>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table></div>';
        container.innerHTML = html;
    },
    
    // ============ CRUD SUCURSALES ============
    showCreate: function() {
        showModal('Nueva Sucursal', `
            <form id="sucursalForm" onsubmit="SucursalesModule.create(event)">
                <div class="form-group">
                    <label>Código *</label>
                    <input type="text" name="codigo" required placeholder="Ej: SC-001">
                </div>
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" name="nombre" required placeholder="Nombre de la sucursal">
                </div>
                <div class="form-group">
                    <label>Dirección *</label>
                    <input type="text" name="direccion" required placeholder="Dirección completa">
                </div>
                <div class="form-group">
                    <label>Teléfono *</label>
                    <input type="text" name="telefono" required placeholder="999-999-999">
                </div>
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" name="email" required placeholder="sucursal@ejemplo.com">
                </div>
                <div class="form-group">
                    <label>Horario de Atención</label>
                    <input type="text" name="horario_atencion" placeholder="Lun-Vie 8am-8pm">
                </div>
                <div class="form-group">
                    <label>Encargado</label>
                    <input type="text" name="encargado" placeholder="Nombre del encargado">
                </div>
                <button type="submit" class="btn btn-primary w-full">Crear Sucursal</button>
            </form>
        `);
    },
    
    create: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            await apiRequest('/api/sucursales/sucursales', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            closeModal();
            showAlert('✅ Sucursal creada exitosamente', 'success');
            this.loadSucursales();
        } catch (error) {
            showAlert('❌ ' + error.message, 'error');
        }
    },
    
    showEdit: function(id) {
        const sucursal = this._sucursalesData.find(s => s.id === id);
        if (!sucursal) {
            showAlert('❌ Sucursal no encontrada', 'error');
            return;
        }

        showModal('Editar Sucursal', `
            <form id="sucursalForm" onsubmit="SucursalesModule.update(event, ${id})">
                <div class="form-group">
                    <label>Código *</label>
                    <input type="text" name="codigo" required value="${sucursal.codigo || ''}">
                </div>
                <div class="form-group">
                    <label>Nombre *</label>
                    <input type="text" name="nombre" required value="${sucursal.nombre}">
                </div>
                <div class="form-group">
                    <label>Dirección *</label>
                    <input type="text" name="direccion" required value="${sucursal.direccion || ''}">
                </div>
                <div class="form-group">
                    <label>Teléfono *</label>
                    <input type="text" name="telefono" required value="${sucursal.telefono || ''}">
                </div>
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" name="email" required value="${sucursal.email || ''}">
                </div>
                <div class="form-group">
                    <label>Horario de Atención</label>
                    <input type="text" name="horario_atencion" value="${sucursal.horario_atencion || ''}">
                </div>
                <div class="form-group">
                    <label>Encargado</label>
                    <input type="text" name="encargado" value="${sucursal.encargado || ''}">
                </div>
                <div class="form-group">
                    <label>Estado</label>
                    <select name="estado">
                        <option value="true" ${sucursal.estado ? 'selected' : ''}>Activo</option>
                        <option value="false" ${!sucursal.estado ? 'selected' : ''}>Inactivo</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary w-full">Actualizar Sucursal</button>
            </form>
        `);
    },
    
    update: async function(event, id) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        data.estado = data.estado === 'true';

        try {
            await apiRequest(`/api/sucursales/sucursales/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            closeModal();
            showAlert('✅ Sucursal actualizada exitosamente', 'success');
            this.loadSucursales();
        } catch (error) {
            showAlert('❌ ' + error.message, 'error');
        }
    },
    
    toggleStatus: async function(id) {
        const sucursal = this._sucursalesData.find(s => s.id === id);
        if (!sucursal) return;

        const action = sucursal.estado ? 'desactivar' : 'activar';
        if (!confirm(`¿Estás seguro de ${action} esta sucursal?`)) return;

        try {
            await apiRequest(`/api/sucursales/sucursales/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ ...sucursal, estado: !sucursal.estado })
            });
            showAlert(`✅ Sucursal ${action}da exitosamente`, 'success');
            this.loadSucursales();
        } catch (error) {
            showAlert('❌ ' + error.message, 'error');
        }
    },
    
    // ============ TRANSFERENCIAS ============
    showCreateTransferencia: function() {
        const sucursalesOptions = this._sucursalesData
            .filter(s => s.estado)
            .map(s => `<option value="${s.id}">${s.nombre}</option>`)
            .join('');

        showModal('Nueva Transferencia', `
            <form id="transferenciaForm" onsubmit="SucursalesModule.createTransferencia(event)">
                <div class="form-group">
                    <label>Sucursal Origen *</label>
                    <select name="sucursal_origen_id" required>
                        <option value="">Seleccionar...</option>
                        ${sucursalesOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Sucursal Destino *</label>
                    <select name="sucursal_destino_id" required>
                        <option value="">Seleccionar...</option>
                        ${sucursalesOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label>Producto ID *</label>
                    <input type="number" name="producto_id" required placeholder="ID del producto">
                </div>
                <div class="form-group">
                    <label>Cantidad *</label>
                    <input type="number" name="cantidad" required min="1" placeholder="1">
                </div>
                <div class="form-group">
                    <label>Lote</label>
                    <input type="text" name="lote" placeholder="Lote del producto">
                </div>
                <div class="form-group">
                    <label>Fecha de Vencimiento</label>
                    <input type="date" name="fecha_vencimiento">
                </div>
                <div class="form-group">
                    <label>Observaciones</label>
                    <textarea name="observaciones" placeholder="Observaciones de la transferencia"></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-full">Solicitar Transferencia</button>
            </form>
        `);
    },
    
    createTransferencia: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        if (data.sucursal_origen_id === data.sucursal_destino_id) {
            showAlert('❌ La sucursal origen y destino no pueden ser la misma', 'error');
            return;
        }

        try {
            await apiRequest('/api/sucursales/transferencias/solicitar', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            closeModal();
            showAlert('✅ Transferencia solicitada exitosamente', 'success');
            this.loadTransferencias();
        } catch (error) {
            showAlert('❌ ' + error.message, 'error');
        }
    },
    
    autorizarTransferencia: async function(id) {
        if (!confirm('¿Autorizar esta transferencia?')) return;
        try {
            await apiRequest(`/api/sucursales/transferencias/${id}/autorizar`, {
                method: 'PUT',
                body: JSON.stringify({ observaciones: 'Autorizada por el sistema' })
            });
            showAlert('✅ Transferencia autorizada', 'success');
            this.loadTransferencias();
        } catch (error) {
            showAlert('❌ ' + error.message, 'error');
        }
    },
    
    completarTransferencia: async function(id) {
        if (!confirm('¿Completar esta transferencia?')) return;
        try {
            await apiRequest(`/api/sucursales/transferencias/${id}/completar`, {
                method: 'PUT'
            });
            showAlert('✅ Transferencia completada', 'success');
            this.loadTransferencias();
        } catch (error) {
            showAlert('❌ ' + error.message, 'error');
        }
    },
    
    cancelarTransferencia: async function(id) {
        if (!confirm('¿Cancelar esta transferencia?')) return;
        try {
            await apiRequest(`/api/sucursales/transferencias/${id}/cancelar`, {
                method: 'PUT',
                body: JSON.stringify({ observaciones: 'Cancelada por el usuario' })
            });
            showAlert('✅ Transferencia cancelada', 'success');
            this.loadTransferencias();
        } catch (error) {
            showAlert('❌ ' + error.message, 'error');
        }
    }
};

// Registrar módulo globalmente
window.SucursalesModule = SucursalesModule;