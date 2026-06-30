// public/js/dashboard.js
// Dashboard principal

const modules = {
    dashboard: DashboardModule,
    ventas: VentasModule,
    inventario: InventarioModule,
    compras: ComprasModule,
    clientes: ClientesModule,
    sucursales: SucursalesModule,
    reportes: ReportesModule
};

let currentModule = 'dashboard';

// Inicializar dashboard
document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    
    loadUserInfo();
    setupNavigation();
    setupLogout();
    setupSidebarToggle();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    var initialModule = getModuleFromPath(window.location.pathname) || 'dashboard';
    loadModule(initialModule, false);

    window.addEventListener('popstate', function(event) {
        var module = (event.state && event.state.module) ? event.state.module : getModuleFromPath(window.location.pathname) || 'dashboard';
        loadModule(module, false);
    });
});

function loadUserInfo() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            document.getElementById('userName').textContent = user.username || 'Usuario';
            document.getElementById('userRole').textContent = user.roles ? user.roles.join(', ') : 'Sin rol';
            document.getElementById('userAvatar').textContent = user.username ? user.username.charAt(0).toUpperCase() : 'U';
        }
    } catch (e) {
        console.error('Error loading user info:', e);
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-item[data-module]').forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            var module = this.dataset.module;
            if (module && modules[module]) {
                loadModule(module, true);
            }
        });
    });
}

function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });
}

function setupSidebarToggle() {
    document.getElementById('toggleSidebar').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('open');
    });
}

function updateDateTime() {
    var now = new Date();
    document.getElementById('currentDateTime').textContent = now.toLocaleString('es-ES');
}

function getModuleFromPath(pathname) {
    var match = pathname.match(/\/public\/(\w+)(?:\.html)?\/?$/);
    return match ? match[1] : null;
}

function loadModule(moduleName, updateHistory) {
    if (!modules[moduleName]) {
        console.error('Módulo ' + moduleName + ' no encontrado');
        return;
    }
    
    currentModule = moduleName;
    
    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
        if (item.dataset.module === moduleName) {
            item.classList.add('active');
        }
    });
    
    // Actualizar título
    document.getElementById('pageTitle').textContent = modules[moduleName].name;
    
    // Actualizar URL
    if (updateHistory) {
        var path = '/public/' + moduleName;
        window.history.pushState({ module: moduleName }, modules[moduleName].name, path);
    }
    
    // Renderizar módulo
    var contentArea = document.getElementById('contentArea');
    if (!contentArea) return;
    
    contentArea.innerHTML = '<div class="loading"><span class="material-symbols-outlined">refresh</span> Cargando...</div>';
    
    try {
        var module = modules[moduleName];
        if (module && typeof module.render === 'function') {
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
        console.error('Error loading module ' + moduleName + ':', error);
        contentArea.innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <span class="material-symbols-outlined text-red-500 text-4xl">error</span>
                <p class="text-red-700 mt-2">Error al cargar el módulo</p>
                <p class="text-sm text-red-600">${error.message}</p>
                <button onclick="loadModule('${moduleName}', true)" class="btn btn-primary mt-4">Reintentar</button>
            </div>
        `;
    }
}

// Función para mostrar alertas
function showAlert(message, type) {
    type = type || 'info';
    var colors = {
        info: 'bg-blue-50 border-blue-200 text-blue-700',
        success: 'bg-green-50 border-green-200 text-green-700',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
        error: 'bg-red-50 border-red-200 text-red-700'
    };
    var icons = {
        info: 'info',
        success: 'check_circle',
        warning: 'warning',
        error: 'error'
    };
    
    var alertDiv = document.createElement('div');
    alertDiv.className = 'p-4 rounded-lg border ' + (colors[type] || colors.info) + ' mb-4 flex items-center gap-3';
    alertDiv.innerHTML = `
        <span class="material-symbols-outlined">${icons[type] || icons.info}</span>
        <span>${message}</span>
        <button class="ml-auto text-gray-400 hover:text-gray-600" onclick="this.parentElement.remove()">✕</button>
    `;
    
    var contentArea = document.getElementById('contentArea');
    if (contentArea) {
        contentArea.insertBefore(alertDiv, contentArea.firstChild);
    }
    
    setTimeout(function() {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Función para hacer requests a la API
async function apiRequest(endpoint, options) {
    options = options || {};
    var token = localStorage.getItem('token');
    if (!token) throw new Error('No autenticado');
    
    var baseUrl = (typeof getApiBase === 'function') ? getApiBase() : 'http://localhost:3000';
    var url = baseUrl + endpoint;
    
    var headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
    if (options.headers) {
        Object.assign(headers, options.headers);
    }
    
    var response = await fetch(url, {
        method: options.method || 'GET',
        headers: headers,
        body: options.body || undefined
    });
    
    if (!response.ok) {
        var error = await response.json().catch(function() {
            return { message: 'Error ' + response.status };
        });
        throw new Error(error.message || 'Error ' + response.status);
    }
    return response.json();
}

// Función para crear tarjeta de estadísticas
function createStatCard(icon, label, value, color) {
    color = color || 'blue';
    var colors = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
        green: { bg: 'bg-green-50', text: 'text-green-600' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
        red: { bg: 'bg-red-50', text: 'text-red-600' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
        indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' }
    };
    
    var c = colors[color] || colors.blue;
    
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

// Hacer funciones globales
window.showAlert = showAlert;
window.apiRequest = apiRequest;
window.createStatCard = createStatCard;
window.loadModule = loadModule;

console.log('✅ dashboard.js cargado');