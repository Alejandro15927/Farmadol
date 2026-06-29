// Dashboard principal
const modules = {
    dashboard: {
        name: 'Dashboard',
        render: DashboardModule.render
    },
    ventas: {
        name: 'Ventas',
        render: VentasModule.render
    },
    inventario: {
        name: 'Inventario',
        render: InventarioModule.render
    },
    compras: {
        name: 'Compras',
        render: ComprasModule.render
    },
    clientes: {
        name: 'Clientes',
        render: ClientesModule.render
    },
    sucursales: {
        name: 'Sucursales',
        render: SucursalesModule.render
    },
    reportes: {
        name: 'Reportes',
        render: ReportesModule.render
    }
};

let currentModule = 'dashboard';

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    
    loadUserInfo();
    loadModule('dashboard');
    setupNavigation();
    setupLogout();
    setupSidebarToggle();
    updateDateTime();
    setInterval(updateDateTime, 1000);
});

function loadUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('userName').textContent = user.username || 'Usuario';
            document.getElementById('userRole').textContent = user.roles ? user.roles.join(', ') : 'Sin rol';
            const avatar = document.getElementById('userAvatar');
            avatar.textContent = user.username ? user.username.charAt(0).toUpperCase() : 'U';
        }
    } catch (e) {
        console.error('Error loading user info:', e);
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-item[data-module]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const module = item.dataset.module;
            if (module && modules[module]) {
                loadModule(module);
            }
        });
    });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

function setupSidebarToggle() {
    const toggleBtn = document.getElementById('toggleSidebar');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }
    
    // Cerrar sidebar al hacer click fuera en móvil
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('toggleSidebar');
        if (window.innerWidth < 1024) {
            if (sidebar && toggle && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
}

function updateDateTime() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        dateTimeElement.textContent = `${dateStr} - ${timeStr}`;
    }
}

function loadModule(moduleName) {
    if (!modules[moduleName]) {
        console.error(`Módulo ${moduleName} no encontrado`);
        return;
    }
    
    currentModule = moduleName;
    
    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.module === moduleName) {
            item.classList.add('active');
        }
    });
    
    // Actualizar título
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = modules[moduleName].name;
    }
    
    // Renderizar módulo
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) {
        console.error('Content area no encontrada');
        return;
    }
    
    contentArea.innerHTML = `<div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>`;
    
    try {
        // Verificar que el módulo tiene un método render
        const module = modules[moduleName];
        if (module && typeof module.render === 'function') {
            // Llamar al render con el contexto del módulo
            module.render.call(module, contentArea);
        } else {
            contentArea.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                    <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                    <p class="text-red-700 mt-2">El módulo ${moduleName} no tiene un método render válido</p>
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error loading module ${moduleName}:`, error);
        contentArea.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                <p class="text-red-700 mt-2">Error al cargar el módulo</p>
                <p class="text-sm text-red-600">${error.message}</p>
                <button class="btn btn-secondary mt-4" onclick="loadModule('${moduleName}')">Reintentar</button>
            </div>
        `;
    }
}

// ============ FUNCIONES GLOBALES ============

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    const colors = {
        info: 'bg-blue-50 border-blue-200 text-blue-700',
        success: 'bg-green-50 border-green-200 text-green-700',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        error: 'bg-red-50 border-red-200 text-red-700'
    };
    
    const icons = {
        info: 'info',
        success: 'check_circle',
        warning: 'warning',
        error: 'error'
    };
    
    alertDiv.className = `p-4 rounded-lg border ${colors[type] || colors.info} mb-4 flex items-center gap-3 animate-fade-in`;
    alertDiv.innerHTML = `
        <span class="material-symbols-outlined">${icons[type] || icons.info}</span>
        <span>${message}</span>
        <button class="ml-auto text-gray-400 hover:text-gray-600" onclick="this.parentElement.remove()">✕</button>
    `;
    
    // Insertar al inicio del content area
    const contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.insertBefore(alertDiv, contentArea.firstChild);
    }
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Función para hacer requests a la API
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    if (!token) {
        throw new Error('No autenticado');
    }
    
    const url = `${getApiBase()}${endpoint}`;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: `Error ${response.status}` }));
        throw new Error(error.message || `Error ${response.status}`);
    }
    
    return response.json();
}

// Función para crear tabla
function createTable(headers, data, actions = null) {
    let html = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                        ${actions ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
    `;
    
    if (data && data.length > 0) {
        data.forEach(row => {
            html += '<tr>';
            headers.forEach(h => {
                const value = row[h] !== undefined && row[h] !== null ? row[h] : '-';
                html += `<td>${value}</td>`;
            });
            if (actions) {
                html += `<td>${typeof actions === 'function' ? actions(row) : actions}</td>`;
            }
            html += '</tr>';
        });
    } else {
        html += `
            <tr>
                <td colspan="${headers.length + (actions ? 1 : 0)}" class="text-center text-gray-500 py-8">
                    No hay datos para mostrar
                </td>
            </tr>
        `;
    }
    
    html += '</tbody></table></div>';
    return html;
}

// Función para crear tarjeta de estadísticas
function createStatCard(icon, label, value, color = 'blue') {
    const colors = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
        green: { bg: 'bg-green-50', text: 'text-green-600' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
        red: { bg: 'bg-red-50', text: 'text-red-600' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' }
    };
    
    const c = colors[color] || colors.blue;
    
    return `
        <div class="stat-card flex items-center gap-4">
            <div class="stat-icon ${c.bg} ${c.text}">
                <span class="material-symbols-outlined">${icon}</span>
            </div>
            <div>
                <p class="text-sm text-gray-500">${label}</p>
                <p class="text-2xl font-bold text-gray-800">${value}</p>
            </div>
        </div>
    `;
}

// ============ FUNCIONES MODALES ============

function showModal(title, content) {
    // Remover modal existente si hay
    closeModal();
    
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.id = 'modalOverlay';
    
    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal()">✕</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Cerrar al hacer click fuera
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    
    // Cerrar con Escape
    document.addEventListener('keydown', handleEscape);
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.remove();
    document.removeEventListener('keydown', handleEscape);
}

function handleEscape(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
}

// Hacer funciones globales disponibles
window.showAlert = showAlert;
window.apiRequest = apiRequest;
window.createTable = createTable;
window.createStatCard = createStatCard;
window.loadModule = loadModule;
window.showModal = showModal;
window.closeModal = closeModal;
window.modules = modules;