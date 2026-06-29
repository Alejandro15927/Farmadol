// Módulo de Compras
const ComprasModule = {
    render: function(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-semibold text-gray-800">Compras</h2>
                <button class="btn btn-primary" onclick="ComprasModule.showCreate()">
                    <span class="material-symbols-outlined text-sm">add</span>
                    Nueva Compra
                </button>
            </div>
            <div id="comprasContent">
                <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
            </div>
        `;
        this.loadCompras();
    },
    
    loadCompras: async function() {
        try {
            const data = await apiRequest('/api/compras/compras');
            const container = document.getElementById('comprasContent');
            
            const headers = ['N° Factura', 'Proveedor', 'Sucursal', 'Total', 'Estado', 'Fecha'];
            const actions = (row) => `
                <button class="btn btn-primary btn-sm" onclick="ComprasModule.view(${row.id})">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                </button>
                <button class="btn btn-secondary btn-sm" onclick="ComprasModule.updateStatus(${row.id})">
                    <span class="material-symbols-outlined text-sm">sync</span>
                </button>
            `;
            
            const formattedData = (data.data || []).map(c => ({
                id: c.id,
                numero_factura: c.numero_factura,
                proveedor: c.proveedor?.razon_social || 'N/A',
                sucursal_id: c.sucursal_id,
                total: `S/ ${c.total}`,
                estado: `<span class="badge ${c.estado === 'recibido' ? 'badge-success' : c.estado === 'pendiente' ? 'badge-warning' : 'badge-danger'}">${c.estado}</span>`,
                fecha_compra: new Date(c.fecha_compra).toLocaleDateString()
            }));
            
            container.innerHTML = createTable(headers, formattedData, actions);
        } catch (error) {
            document.getElementById('comprasContent').innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    <p class="text-red-700 mt-2">Error al cargar compras</p>
                    <p class="text-sm text-red-600">${error.message}</p>
                </div>
            `;
        }
    },
    
    showCreate: function() {
        showModal('Nueva Compra', `
            <form id="createCompraForm" onsubmit="ComprasModule.create(event)">
                <div class="form-group">
                    <label>Número Factura</label>
                    <input type="text" name="numero_factura" required placeholder="F001-000001">
                </div>
                <div class="form-group">
                    <label>Proveedor</label>
                    <select name="proveedor_id" required>
                        <option value="">Seleccionar...</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Sucursal</label>
                    <select name="sucursal_id" required>
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
                            <input type="text" name="lote[]" placeholder="Lote" class="w-24" required>
                            <input type="number" name="cantidad[]" placeholder="Cant" class="w-20" required min="1">
                            <input type="number" name="costo_unitario[]" placeholder="Costo" class="w-24" required step="0.01">
                            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
                        </div>
                    </div>
                    <button type="button" class="btn btn-secondary btn-sm" onclick="ComprasModule.addProducto()">
                        <span class="material-symbols-outlined text-sm">add</span> Agregar Producto
                    </button>
                </div>
                <div class="form-group">
                    <label>Observaciones</label>
                    <textarea name="observaciones"></textarea>
                </div>
                <button type="submit" class="btn btn-primary w-full">Registrar Compra</button>
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
            <input type="text" name="lote[]" placeholder="Lote" class="w-24" required>
            <input type="number" name="cantidad[]" placeholder="Cant" class="w-20" required min="1">
            <input type="number" name="costo_unitario[]" placeholder="Costo" class="w-24" required step="0.01">
            <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">✕</button>
        `;
        list.appendChild(div);
    },
    
    create: async function(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            numero_factura: formData.get('numero_factura'),
            proveedor_id: formData.get('proveedor_id'),
            sucursal_id: formData.get('sucursal_id'),
            observaciones: formData.get('observaciones'),
            detalles: []
        };
        
        const productoIds = formData.getAll('producto_id[]');
        const lotes = formData.getAll('lote[]');
        const cantidades = formData.getAll('cantidad[]');
        const costos = formData.getAll('costo_unitario[]');
        
        for (let i = 0; i < productoIds.length; i++) {
            data.detalles.push({
                producto_id: parseInt(productoIds[i]),
                lote: lotes[i],
                cantidad: parseInt(cantidades[i]),
                costo_unitario: parseFloat(costos[i]),
                fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
        }
        
        try {
            await apiRequest('/api/compras/compras', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            closeModal();
            showAlert('Compra registrada exitosamente', 'success');
            this.loadCompras();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    },
    
    view: function(id) {
        showModal('Detalle de Compra', `
            <div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>
        `);
    },
    
    updateStatus: async function(id) {
        const status = prompt('Ingrese el nuevo estado (pendiente, recibido, parcial, cancelado):');
        if (!status) return;
        
        try {
            await apiRequest(`/api/compras/compras/${id}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ estado: status })
            });
            showAlert('Estado actualizado exitosamente', 'success');
            this.loadCompras();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }
};

window.ComprasModule = ComprasModule;