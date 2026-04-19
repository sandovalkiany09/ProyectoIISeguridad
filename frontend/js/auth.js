/* ═══════════════════════════════════════════
   AUTH — Lógica de sesión y login
   Cumple RS-04: Gestión Segura de Sesiones
     · Invalidación por inactividad (5 min)
     · Regeneración de ID de sesión post-login
     · Sin información sensible en texto plano
═══════════════════════════════════════════ */

const Auth = (() => {

  /* ── Estado de sesión ── */
  let _token = localStorage.getItem('sp_token') || '';
  let _user  = JSON.parse(localStorage.getItem('sp_user') || 'null');

  function getToken()   { return _token; }
  function getUser()    { return _user; }
  function isLoggedIn() { return !!_token && !!_user; }

  /* ── Guardar sesión (solo datos no sensibles) ── */
  function save(token, user) {
    // RS-04: solo se persiste el token JWT y datos mínimos del usuario.
    // Nunca se almacena la contraseña ni información sensible en texto plano.
    _token = token;
    _user  = { id: user.id, username: user.username, rol_id: user.rol_id };
    localStorage.setItem('sp_token', token);
    localStorage.setItem('sp_user', JSON.stringify(_user));
  }

  /* ── Cerrar sesión ── */
  function logout() {
    _stopInactivityWatcher();
    _token = '';
    _user  = null;
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    showAuthScreen();
  }

  /* ════════════════════════════════════════
     RS-04 — INACTIVIDAD (5 minutos)
  ════════════════════════════════════════ */
  const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutos en ms
  let _inactivityTimer   = null;

  function _resetInactivityTimer() {
    clearTimeout(_inactivityTimer);
    _inactivityTimer = setTimeout(_onInactivityExpired, INACTIVITY_LIMIT);
  }

  function _onInactivityExpired() {
    logout();
    // Mostrar aviso al usuario tras volver a la pantalla de login
    setTimeout(() => {
      showError('login-error', 'Tu sesión expiró por inactividad. Inicia sesión de nuevo.');
    }, 100);
  }

  function _startInactivityWatcher() {
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt =>
      document.addEventListener(evt, _resetInactivityTimer, { passive: true })
    );
    _resetInactivityTimer(); // Arrancar el timer desde el momento del login
  }

  function _stopInactivityWatcher() {
    clearTimeout(_inactivityTimer);
    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evt =>
      document.removeEventListener(evt, _resetInactivityTimer)
    );
  }

  /* ════════════════════════════════════════
     RS-04 — SESSION FIXATION
     Se invalida cualquier sesión previa antes
     de establecer la nueva, forzando un ID
     de sesión fresco tras cada login exitoso.
  ════════════════════════════════════════ */
  function _invalidatePreviousSession() {
    _stopInactivityWatcher();
    localStorage.removeItem('sp_token');
    localStorage.removeItem('sp_user');
    _token = '';
    _user  = null;
  }

  /* ── Mostrar pantalla de autenticación ── */
  function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app').style.display = 'none';

  // Limpiar campos del formulario de login
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';

  switchAuthTab('login');
  }

  /* ── Iniciar app autenticada ── */
  function showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    _startInactivityWatcher(); // RS-04: iniciar vigilancia de inactividad
    App.init(_user);
  }

  /* ── Tabs login ── */
  function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.querySelectorAll('.auth-view').forEach(el => {
      el.classList.toggle('active', el.id === 'auth-' + tab);
    });
    clearAuthErrors();
  }

  function clearAuthErrors() {
    document.querySelectorAll('.auth-error-box').forEach(el => {
      el.style.display = 'none';
      el.textContent = '';
    });
  }

  function showError(elId, msg) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'flex';
  }

  /* ════════════════════════════════════════
     LOGIN
  ════════════════════════════════════════ */
  async function doLogin(e) {
    if (e) e.preventDefault();
    clearAuthErrors();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      showError('login-error', 'Por favor completa todos los campos.');
      return;
    }

    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.innerHTML = `${spinnerHTML()} Ingresando...`;

    try {
      // RS-04: invalidar sesión previa antes de crear la nueva (Session Fixation)
      _invalidatePreviousSession();

      const data = await AuthAPI.login(username, password);

      // RS-04: decodificar el JWT para extraer datos — nunca almacenar la contraseña
      const user = decodeJWT(data.token);
      if (!user) throw new Error('Token inválido recibido del servidor.');

      // RS-04: guardar nueva sesión con ID regenerado (nuevo token JWT del backend)
      save(data.token, user);
      showApp();

    } catch (err) {
      showError('login-error', err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Iniciar sesión';
    }
  }

  /* ── Toggle visibilidad contraseña ── */
  function togglePassword(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn   = document.getElementById(btnId);
    if (!input || !btn) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    btn.innerHTML = isPassword ? Icons.eyeOff : Icons.eye;
  }

  /* ════════════════════════════════════════
     BOOTSTRAP
  ════════════════════════════════════════ */
  function init() {
    // Tab clicks
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    // Enter en login
    ['login-username', 'login-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') doLogin(e);
      });
    });

    // Botones toggle contraseña
    document.getElementById('toggle-login-pass')?.addEventListener('click', () =>
      togglePassword('login-password', 'toggle-login-pass'));

    // RS-04: si ya hay sesión activa, arrancar el watcher de inactividad
    if (isLoggedIn()) {
      showApp();
    } else {
      showAuthScreen();
    }
  }

  return { init, logout, getUser, getToken, isLoggedIn, doLogin, switchAuthTab };
})();