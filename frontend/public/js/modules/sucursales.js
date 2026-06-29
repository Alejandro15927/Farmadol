// Módulo de Sucursales
const SucursalesModule = {
    render: function(container) {
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
        `;
        this.loadSucursales();
    },
    
    loadSucursales: async function() {
        try {
            const data = await apiRequest('/api/sucursales/sucursales');
            const container = document.getElementById('sucursalesContent');
            
            const headers = ['ID', 'Código', 'Nombre', 'Dirección', 'Teléfono', 'Email', 'Estado'];
            const actions = (row) => `
                <button class="btn btn-primary btn-sm" onclick="SucursalesModule.edit(${row.id})">
                    <span class="material-symbols-outlined text-sm">edit</span>
                </button>
                <button class="btn btn-danger btn-sm" onclick="SucursalesModule.delete(${row.id})">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            `;
            
            container.innerHTML = createTable(headers, data.data || [], actions);
        } catch (error) {
            document.getElementById('sucursalesContent').innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    <p class="text-red-700 mt-2">Error al cargar sucursales</p>
                    <p class="text-sm text-red-600">${error.message}</p>
                </div>
            `;
        }
    },
    
    showCreate: function() {
        showModal('Nueva Sucursal', `
            <form id="createSucursalForm" onsubmit="SucursalesModule.create(event)">
                <div class="form-group">
                    <label>Código</label>
                    <input type="text" name="codigo" required placeholder="SC-001">
                </div>
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" name="nombre" required placeholder="Nombre de la sucursal">
                </div>
                <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" name="direccion" required placeholder="Dirección completa">
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="text" name="telefono" required placeholder="999-999-999">
                </div>
                <div class="form-group">
                    <label>Email</label>
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
            showAlert('Sucursal creada exitosamente', 'success');
            this.loadSucursales();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    },
    
    edit: function(id) {
        showModal('Editar Sucursal', `
            <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
        `);
        // Implementar edición
    },
    
    delete: async function(id) {
        if (!confirm('¿Estás seguro de eliminar esta sucursal?')) return;
        try {
            await apiRequest(`/api/sucursales/sucursales/${id}`, { method: 'DELETE' });
            showAlert('Sucursal eliminada exitosamente', 'success');
            this.loadSucursales();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }
};

window.SucursalesModule = SucursalesModule;