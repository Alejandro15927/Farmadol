// Módulo de Autenticación - Gestión de usuarios y roles
const AuthModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Gestión de Usuarios</h2>
                <button class="btn btn-primary" onclick="AuthModule.showCreateUser()">
                    <span class="material-symbols-outlined text-sm">person_add</span>
                    Nuevo Usuario
                </button>
            </div>
            <div id="authContent">
                <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
            </div>
        `;
        
        this.loadUsers();
    },
    
    loadUsers: async function() {
        try {
            const data = await apiRequest('/api/auth/users');
            const container = document.getElementById('authContent');
            
            const headers = ['ID', 'Usuario', 'Email', 'Roles', 'Estado', 'Sucursal'];
            const actions = (row) => `
                <button class="btn btn-primary btn-sm" onclick="AuthModule.editUser(${row.id})">
                    <span class="material-symbols-outlined text-sm">edit</span>
                </button>
                <button class="btn btn-danger btn-sm" onclick="AuthModule.deleteUser(${row.id})">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            `;
            
            container.innerHTML = createTable(headers, data.data || [], actions);
        } catch (error) {
            console.error('Error loading users:', error);
            document.getElementById('authContent').innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    <p class="text-red-700 mt-2">Error al cargar usuarios</p>
                    <p class="text-sm text-red-600">${error.message}</p>
                </div>
            `;
        }
    },
    
    showCreateUser: function() {
        showModal('Crear Usuario', `
            <form id="createUserForm" onsubmit="AuthModule.createUser(event)">
                <div class="form-group">
                    <label>Usuario</label>
                    <input type="text" name="username" required placeholder="Nombre de usuario">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" required placeholder="correo@ejemplo.com">
                </div>
                <div class="form-group">
                    <label>Contraseña</label>
                    <input type="password" name="password" required placeholder="Mínimo 6 caracteres">
                </div>
                <div class="form-group">
                    <label>Roles</label>
                    <select name="roles" multiple required>
                        <option value="ADMIN">Administrador</option>
                        <option value="GERENTE">Gerente</option>
                        <option value="CAJERO">Cajero</option>
                        <option value="ALMACENERO">Almacenero</option>
                    </select>
                    <span class="text-xs text-gray-500">Mantén presionado Ctrl para seleccionar múltiples</span>
                </div>
                <div class="form-group">
                    <label>Sucursal</label>
                    <select name="sucursal_id">
                        <option value="">Sin sucursal</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary w-full">Crear Usuario</button>
            </form>
        `);
    },
    
    createUser: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        data.roles = data.roles.split(',');
        
        try {
            await apiRequest('/api/auth/users', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            closeModal();
            showAlert('Usuario creado exitosamente', 'success');
            this.loadUsers();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    },
    
    editUser: function(id) {
        showModal('Editar Usuario', `
            <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
        `);
        // Implementar edición
    },
    
    deleteUser: async function(id) {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await apiRequest(`/api/auth/users/${id}`, { method: 'DELETE' });
            showAlert('Usuario eliminado exitosamente', 'success');
            this.loadUsers();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }
};

// Hacer módulo disponible globalmente
window.AuthModule = AuthModule;