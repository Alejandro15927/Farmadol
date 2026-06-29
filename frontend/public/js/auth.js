// public/js/auth.js
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = '/index.html';
    return false;
  }
  return true;
}

function logout() {
  clearAuth();
  window.location.href = '/index.html';
}

console.log('✅ auth.js cargado');