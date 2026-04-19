/* ═══════════════════════════════════════════
   API CLIENT — Comunicación con el backend
   Base URL: http://localhost:3000
═══════════════════════════════════════════ */

const API_BASE  = 'http://localhost:3000/api';
const AUTH_BASE = 'http://localhost:3000/api/auth';

/* ── Obtener token del localStorage ── */
function getToken() {
  return localStorage.getItem('sp_token') || '';
}

/* ── Headers autenticados ── */
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + getToken()
  };
}

/* ── Cliente HTTP base ── */
async function apiRequest(method, url, body = null) {
  const options = {
    method,
    headers: authHeaders()
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);

  // Token expirado o inválido
  if (res.status === 401 || res.status === 403) {
    const data = await res.json().catch(() => ({}));
    // Si dice "expirado" desloguear silenciosamente
    if (res.status === 401) {
      Auth.logout();
      return;
    }
    throw new Error(data.message || 'Acceso denegado');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

/* ══════════════════════════════════════════
   API DE AUTENTICACIÓN
══════════════════════════════════════════ */
const AuthAPI = {
  login(username, password) {
    return fetch(AUTH_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Credenciales inválidas');
      return data;
    });
  },

  register(username, email, password, rol_id) {
    return fetch(AUTH_BASE + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, rol_id })
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar');
      return data;
    });
  }
};

/* ══════════════════════════════════════════
   API DE USUARIOS
══════════════════════════════════════════ */
const UsuariosAPI = {
  getAll()           { return apiRequest('GET',    API_BASE + '/usuarios'); },
  create(body)       { return apiRequest('POST',   API_BASE + '/usuarios', body); },
  update(id, body)   { return apiRequest('PATCH',  API_BASE + '/usuarios/' + id, body); },
  delete(id)         { return apiRequest('DELETE', API_BASE + '/usuarios/' + id); }
};

/* ══════════════════════════════════════════
   API DE ROLES
══════════════════════════════════════════ */
const RolesAPI = {
  getAll()           { return apiRequest('GET',    API_BASE + '/roles'); },
  create(nombre)     { return apiRequest('POST',   API_BASE + '/roles', { nombre }); },
  update(id, nombre) { return apiRequest('PATCH',  API_BASE + '/roles/' + id, { nombre }); },
  delete(id)         { return apiRequest('DELETE', API_BASE + '/roles/' + id); }
};

/* ══════════════════════════════════════════
   API DE PRODUCTOS
══════════════════════════════════════════ */
const ProductosAPI = {
  getAll()           { return apiRequest('GET',    API_BASE + '/productos'); },
  create(body)       { return apiRequest('POST',   API_BASE + '/productos', body); },
  update(id, body)   { return apiRequest('PATCH',  API_BASE + '/productos/' + id, body); },
  delete(id)         { return apiRequest('DELETE', API_BASE + '/productos/' + id); }
};

/* ══════════════════════════════════════════
   API DE AUDITORÍA
══════════════════════════════════════════ */
const AuditoriaAPI = {
  getAll() { return apiRequest('GET', API_BASE + '/auditoria'); }
};

