/* ═══════════════════════════════════════════
   UTILITIES — Toast, formato, íconos, helpers
   + Bootstrap de la app (reemplaza el script inline del HTML)
   + Listeners globales (reemplazan todos los onclick/oninput del HTML)
═══════════════════════════════════════════ */

/* ── TOAST NOTIFICATIONS ── */
const Toast = (() => {
  function show(message, type = 'info', duration = 3800) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-dot"></span><span class="toast-text">${message}</span>`;
    container.appendChild(toast);
    const remove = () => {
      toast.classList.add('out');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };
    const timer = setTimeout(remove, duration);
    toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
  }
  return {
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error', 5000),
    warning: (msg) => show(msg, 'warning'),
    info:    (msg) => show(msg, 'info')
  };
})();

/* ── MODALES ── */
const Modal = (() => {
  function open(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function close(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Cerrar al hacer click en overlay
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.classList.remove('open');
      document.body.style.overflow = '';
    }
    // Cerrar con data-modal-close (reemplaza todos los onclick="Modal.close(...)")
    const closeBtn = e.target.closest('[data-modal-close]');
    if (closeBtn) {
      close(closeBtn.dataset.modalClose);
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => {
        m.classList.remove('open');
        document.body.style.overflow = '';
      });
    }
  });

  return { open, close };
})();

/* ── FORMATEO DE FECHAS ── */
function fmtDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('es-CR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function fmtDateShort(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CR', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function fmtMoney(val) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'USD' }).format(val);
}

/* ── BADGES DE ROLES ── */
const ROLE_MAP = {
  1: { name: 'SuperAdmin',  class: 'badge-sky' },
  2: { name: 'Auditor',     class: 'badge-warning' },
  3: { name: 'Registrador', class: 'badge-success' }
};

function roleBadge(rolId, rolName) {
  const r = ROLE_MAP[rolId] || { name: rolName || ('Rol ' + rolId), class: 'badge-neutral' };
  return `<span class="badge ${r.class}">${r.name}</span>`;
}

/* ── SPINNER HTML ── */
function spinnerHTML(size = '') {
  return `<span class="spinner ${size}"></span>`;
}

/* ── LOADING ROW ── */
function loadingRow(cols) {
  return `<tr><td colspan="${cols}">
    <div class="loading-row">
      <div class="spinner spinner-lg"></div>
      <p style="margin-top:12px;font-size:0.82rem">Cargando datos...</p>
    </div>
  </td></tr>`;
}

/* ── EMPTY STATE ROW ── */
function emptyRow(cols, message = 'No hay registros disponibles') {
  return `<tr><td colspan="${cols}">
    <div class="empty-state">
      <div class="empty-state-icon">
        <svg fill="none" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
        </svg>
      </div>
      <p>${message}</p>
    </div>
  </td></tr>`;
}

/* ── DECODIFICAR JWT PAYLOAD ── */
function decodeJWT(token) {
  try { return JSON.parse(atob(token.split('.')[1])); }
  catch { return null; }
}

/* ── CONFIRMAR ACCIÓN ── */
function confirmAction(message) {
  return window.confirm(message);
}

/* ── ÍCONOS SVG ── */
const Icons = {
  dashboard: `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  users:     `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path stroke-linecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
  shield:    `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  box:       `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  log:       `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
  edit:      `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`,
  trash:     `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path stroke-linecap="round" d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>`,
  plus:      `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  eye:       `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff:    `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  logout:    `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  close:     `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  save:      `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/></svg>`,
};

/* ══════════════════════════════════════════════════════════════
   BOOTSTRAP — reemplaza el <script> inline del HTML
   Se ejecuta cuando el DOM está listo.
   Registra TODOS los event listeners que antes eran onclick/oninput.
══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Iniciar autenticación ── */
  Auth.init();

  /* ── Logout ── */
  document.getElementById('btn-logout')
    ?.addEventListener('click', () => Auth.logout());

  /* ── Login: botón y Enter ── */
  document.getElementById('btn-login')
    ?.addEventListener('click', (e) => Auth.doLogin(e));

  ['login-username', 'login-password'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') Auth.doLogin(e);
    });
  });

  /* ── Búsquedas en tablas (reemplaza oninput) ── */
  document.getElementById('search-usuarios')
    ?.addEventListener('input', () => App.filterSection('usuarios'));

  document.getElementById('search-productos')
    ?.addEventListener('input', () => App.filterSection('productos'));

  document.getElementById('search-auditoria')
    ?.addEventListener('input', () => App.filterSection('auditoria'));

  /* ── Botones "Nuevo" ── */
  document.getElementById('btn-new-user')
    ?.addEventListener('click', () => App.openNuevoUsuario());

  document.getElementById('btn-new-role')
    ?.addEventListener('click', () => App.openNuevoRole());

  document.getElementById('btn-new-prod')
    ?.addEventListener('click', () => App.openNuevoProducto());

  /* ── Botones "Guardar" de modales ── */
  document.getElementById('btn-save-user')
    ?.addEventListener('click', () => App.saveUsuario());

  document.getElementById('btn-save-role')
    ?.addEventListener('click', () => App.saveRole());

  document.getElementById('btn-save-product')
    ?.addEventListener('click', () => App.saveProducto());

});