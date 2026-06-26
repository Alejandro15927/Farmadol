function getToken() {
  return localStorage.getItem('token');
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function logout() {
  clearAuth();
  window.location.href = 'index.html';
}
