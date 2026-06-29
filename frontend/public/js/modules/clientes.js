// Módulo de Clientes
const ClientesModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Clientes</h2>
                <button class="btn btn-primary" onclick="ClientesModule.showCreate()">
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
            const data = await apiRequest('/api/clientes/clientes');
            const container = document.getElementById('clientesContent');
            
            const headers = ['ID', 'Documento', 'Nombres', 'Apellidos', 'Email', 'Teléfono', 'Nivel'];
            const actions = (row) => `
                <button class="btn btn-primary btn-sm" onclick="ClientesModule.edit(${row.id})">
                    <span class="material-symbols-outlined text-sm">edit</span>
                </button>
                <button class="btn btn-danger btn-sm" onclick="ClientesModule.delete(${row.id})">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            `;
            
            container.innerHTML = createTable(headers, data.data || [], actions);
        } catch (error) {
            document.getElementById('clientesContent').innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    <p class="text-red-700 mt-2">Error al cargar clientes</p>
                    <p class="text-sm text-red-600">${error.message}</p>
                </div>
            `;
        }
    },
    
    showCreate: function() {
        showModal('Nuevo Cliente', `
            <form id="createClienteForm" onsubmit="ClientesModule.create(event)">
                <div class="form-group">
                    <label>Tipo Documento</label>
                    <select name="tipo_documento" required>
                        <option value="DNI">DNI</option>
                        <option value="RUC">RUC</option>
                        <option value="CE">CE</option>
                        <option value="PASAPORTE">Pasaporte</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Número Documento</label>
                    <input type="text" name="numero_documento" required placeholder="12345678">
                </div>
                <div class="form-group">
                    <label>Nombres</label>
                    <input type="text" name="nombres" required placeholder="Nombres">
                </div>
                <div class="form-group">
                    <label>Apellidos</label>
                    <input type="text" name="apellidos" required placeholder="Apellidos">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" required placeholder="correo@ejemplo.com">
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="text" name="telefono" required placeholder="999-999-999">
                </div>
                <div class="form-group">
                    <label>Dirección</label>
                    <input type="text" name="direccion" placeholder="Dirección completa">
                </div>
                <button type="submit" class="btn btn-primary w-full">Crear Cliente</button>
            </form>
        `);
    },
    
    create: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
            await apiRequest('/api/clientes/clientes', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            closeModal();
            showAlert('Cliente creado exitosamente', 'success');
            this.loadClientes();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    },
    
    edit: function(id) {
        showModal('Editar Cliente', `
            <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
        `);
    },
    
    delete: async function(id) {
        if (!confirm('¿Estás seguro de eliminar este cliente?')) return;
        try {
            await apiRequest(`/api/clientes/clientes/${id}`, { method: 'DELETE' });
            showAlert('Cliente eliminado exitosamente', 'success');
            this.loadClientes();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }
};

window.ClientesModule = ClientesModule;