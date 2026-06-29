// Módulo de Ventas
const VentasModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Ventas</h2>
                <button class="btn btn-primary" onclick="VentasModule.showCreate()">
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
            const data = await apiRequest('/api/ventas/ventas');
            const container = document.getElementById('ventasContent');
            
            const headers = ['N° Venta', 'Cliente', 'Método Pago', 'Total', 'Estado', 'Fecha'];
            const actions = (row) => `
                <button class="btn btn-primary btn-sm" onclick="VentasModule.view(${row.id})">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                </button>
                <button class="btn btn-danger btn-sm" onclick="VentasModule.cancel(${row.id})">
                    <span class="material-symbols-outlined text-sm">close</span>
                </button>
            `;
            
            const formattedData = (data.data || []).map(v => ({
                id: v.id,
                numero_venta: v.numero_venta,
                cliente: v.cliente ? `${v.cliente.nombres} ${v.cliente.apellidos}` : 'Cliente General',
                metodo_pago: v.metodo_pago?.nombre || 'N/A',
                total: `S/ ${v.total}`,
                estado: `<span class="badge ${v.estado === 'completada' ? 'badge-success' : 'badge-danger'}">${v.estado}</span>`,
                fecha_venta: new Date(v.fecha_venta).toLocaleDateString()
            }));
            
            container.innerHTML = createTable(headers, formattedData, actions);
        } catch (error) {
            document.getElementById('ventasContent').innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    <p class="text-red-700 mt-2">Error al cargar ventas</p>
                    <p class="text-sm text-red-600">${error.message}</p>
                </div>
            `;
        }
    },
    
    showCreate: function() {
        showModal('Nueva Venta', `
            <form id="createVentaForm" onsubmit="VentasModule.create(event)">
                <div class="form-group">
                    <label>Sucursal</label>
                    <select name="sucursal_id" required>
                        <option value="">Seleccionar...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Cliente</label>
                    <select name="cliente_id">
                        <option value="">Cliente General</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Método de Pago</label>
                    <select name="metodo_pago_id" required>
                        <option value="">Seleccionar...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Productos</label>
                    <div id="productosList">
                        <div class="flex gap-2 mb-2">
                            <select name="producto_id[]" class="flex-1" required>
                                <option value="">Seleccionar producto...</option>
                            </select>
                            <input type="number" name="cantidad[]" placeholder="Cant" class="w-20" required min="1">
                            <input type="number" name="precio_unitario[]" placeholder="Precio" class="w-24" required step="0.01">
                            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="VentasModule.addProducto()">
                        <span class="material-symbols-outlined text-sm">add</span> Agregar Producto
                    </button>
                </div>
                <div class="form-group">
                    <label>Descuento</label>
                    <input type="number" name="descuento" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Monto Recibido</label>
                    <input type="number" name="monto_recibido" step="0.01" placeholder="0.00">
                </div>
                <div class="form-group">
                    <label>Observaciones</label>
                    <textarea name="observaciones"></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-full">Registrar Venta</button>
            </form>
        `);
    },
    
    addProducto: function() {
        const list = document.getElementById('productosList');
        const div = document.createElement('div');
        div.className = 'flex gap-2 mb-2';
        div.innerHTML = `
            <select name="producto_id[]" class="flex-1" required>
                <option value="">Seleccionar producto...</option>
            </select>
            <input type="number" name="cantidad[]" placeholder="Cant" class="w-20" required min="1">
            <input type="number" name="precio_unitario[]" placeholder="Precio" class="w-24" required step="0.01">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
        `;
        list.appendChild(div);
    },
    
    create: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            sucursal_id: formData.get('sucursal_id'),
            cliente_id: formData.get('cliente_id'),
            metodo_pago_id: formData.get('metodo_pago_id'),
            descuento: formData.get('descuento') || 0,
            monto_recibido: formData.get('monto_recibido'),
            observaciones: formData.get('observaciones'),
            detalles: []
        };
        
        const productoIds = formData.getAll('producto_id[]');
        const cantidades = formData.getAll('cantidad[]');
        const precios = formData.getAll('precio_unitario[]');
        
        for (let i = 0; i < productoIds.length; i++) {
            data.detalles.push({
                producto_id: parseInt(productoIds[i]),
                inventario_id: 1, // Esto debería ser dinámico
                cantidad: parseInt(cantidades[i]),
                precio_unitario: parseFloat(precios[i]),
                descuento: 0
            });
        }
        
        try {
            await apiRequest('/api/ventas/ventas', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            closeModal();
            showAlert('Venta registrada exitosamente', 'success');
            this.loadVentas();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    },
    
    view: function(id) {
        showModal('Detalle de Venta', `
            <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
        `);
    },
    
    cancel: async function(id) {
        if (!confirm('¿Estás seguro de anular esta venta?')) return;
        try {
            await apiRequest(`/api/ventas/ventas/${id}/anular`, {
                method: 'PUT',
                body: JSON.stringify({ observaciones: 'Anulada por usuario' })
            });
            showAlert('Venta anulada exitosamente', 'success');
            this.loadVentas();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }
};

window.VentasModule = VentasModule;