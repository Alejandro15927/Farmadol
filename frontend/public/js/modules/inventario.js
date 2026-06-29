// Módulo de Inventario
const InventarioModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Inventario</h2>
                <button class="btn btn-primary" onclick="InventarioModule.showCreate()">
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
            const data = await apiRequest('/api/inventario/productos');
            const container = document.getElementById('inventarioContent');
            
            const headers = ['ID', 'Código', 'Nombre', 'Categoría', 'Precio Venta', 'Stock', 'Estado'];
            const actions = (row) => `
                <button class="btn btn-primary btn-sm" onclick="InventarioModule.edit(${row.id})">
                    <span class="material-symbols-outlined text-sm">edit</span>
                </button>
                <button class="btn btn-danger btn-sm" onclick="InventarioModule.delete(${row.id})">
                    <span class="material-symbols-outlined text-sm">delete</span>
                </button>
            `;
            
            const formattedData = (data.data || []).map(p => ({
                id: p.id,
                codigo: p.codigo,
                nombre: p.nombre,
                categoria: p.categoria?.nombre || 'N/A',
                precio_venta: `S/ ${p.precio_venta}`,
                stock: p.inventario?.reduce((sum, i) => sum + i.cantidad, 0) || 0,
                estado: p.estado ? 'Activo' : 'Inactivo'
            }));
            
            container.innerHTML = createTable(headers, formattedData, actions);
        } catch (error) {
            document.getElementById('inventarioContent').innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    <p class="text-red-700 mt-2">Error al cargar productos</p>
                    <p class="text-sm text-red-600">${error.message}</p>
                </div>
            `;
        }
    },
    
    showCreate: function() {
        showModal('Nuevo Producto', `
            <form id="createProductoForm" onsubmit="InventarioModule.create(event)">
                <div class="form-group">
                    <label>Código</label>
                    <input type="text" name="codigo" required placeholder="PROD-001">
                </div>
                <div class="form-group">
                    <label>Nombre</label>
                    <input type="text" name="nombre" required placeholder="Nombre del producto">
                </div>
                <div class="form-group">
                    <label>Descripción</label>
                    <textarea name="descripcion" placeholder="Descripción del producto"></textarea>
                </div>
                <div class="form-group">
                    <label>Categoría</label>
                    <select name="categoria_id" required>
                        <option value="">Seleccionar...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Precio Compra</label>
                    <input type="number" name="precio_compra" step="0.01" required placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Precio Venta</label>
                    <input type="number" name="precio_venta" step="0.01" required placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Stock Mínimo</label>
                    <input type="number" name="stock_minimo" required placeholder="10">
                </div>
                <div class="form-group">
                    <label>Requiere Receta</label>
                    <select name="requiere_receta">
                        <option value="false">No</option>
                        <option value="true">Sí</option>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary w-full">Crear Producto</button>
            </form>
        `);
    },
    
    create: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
            await apiRequest('/api/inventario/productos', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            closeModal();
            showAlert('Producto creado exitosamente', 'success');
            this.loadProductos();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    },
    
    edit: function(id) {
        showModal('Editar Producto', `
            <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
        `);
    },
    
    delete: async function(id) {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await apiRequest(`/api/inventario/productos/${id}`, { method: 'DELETE' });
            showAlert('Producto eliminado exitosamente', 'success');
            this.loadProductos();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }
};

window.InventarioModule = InventarioModule;