/* ═══════════════════════════════════════════
   API CLIENT
   RS-04/RS-05: El JWT vive en una cookie HttpOnly.
   El navegador la envía automáticamente con credentials:'include'.
   Este archivo NUNCA lee ni escribe localStorage con tokens.
═══════════════════════════════════════════ */

const API_BASE  = 'http://localhost:3000/api';
const AUTH_BASE = 'http://localhost:3000/api/auth';

/**
 * Cliente HTTP base.
 * credentials: 'include' hace que el navegador adjunte automáticamente
 * la cookie HttpOnly en cada request — sin que JS toque el token.
 */
async function apiRequest(method, url, body = null) {
  const options = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);

  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    Auth.handleSessionExpired(data.reason);
    throw new Error(data.message || 'Sesión expirada');
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Error ${res.status}`);
  return data;
}

const AuthAPI = {
  login(username, password) {
    return fetch(AUTH_BASE + '/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Credenciales inválidas');
      return data;
    });
  },

  register(username, email, password, rol_id) {
    return fetch(AUTH_BASE + '/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, rol_id }),
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al registrar');
      return data;
    });
  },

  logout() {
    return fetch(AUTH_BASE + '/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {});
  },

  me() {
    return fetch(AUTH_BASE + '/me', {
      method: 'GET',
      credentials: 'include',
    }).then(async res => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Sin sesión');
      return data;
    });
  },
};

const UsuariosAPI = {
  getAll()         { return apiRequest('GET',    API_BASE + '/usuarios'); },
  create(body)     { return apiRequest('POST',   API_BASE + '/usuarios', body); },
  update(id, body) { return apiRequest('PATCH',  API_BASE + '/usuarios/' + id, body); },
  delete(id)       { return apiRequest('DELETE', API_BASE + '/usuarios/' + id); },
};

const RolesAPI = {
  getAll()           { return apiRequest('GET',    API_BASE + '/roles'); },
  create(nombre)     { return apiRequest('POST',   API_BASE + '/roles', { nombre }); },
  update(id, nombre) { return apiRequest('PATCH',  API_BASE + '/roles/' + id, { nombre }); },
  delete(id)         { return apiRequest('DELETE', API_BASE + '/roles/' + id); },
};

const ProductosAPI = {
  getAll()         { return apiRequest('GET',    API_BASE + '/productos'); },
  create(body)     { return apiRequest('POST',   API_BASE + '/productos', body); },
  update(id, body) { return apiRequest('PATCH',  API_BASE + '/productos/' + id, body); },
  delete(id)       { return apiRequest('DELETE', API_BASE + '/productos/' + id); },
};

const AuditoriaAPI = {
  getAll() { return apiRequest('GET', API_BASE + '/auditoria'); },
};