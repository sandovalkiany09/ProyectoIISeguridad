/* ═══════════════════════════════════════════
   AUTH — Lógica de sesión
   RS-04: NO usa localStorage para el token.
          El estado del usuario (nombre, rol) sí se guarda en sessionStorage
          como datos públicos no sensibles, solo para la UI.
   RS-05: El JWT nunca es accesible desde JS — vive en cookie HttpOnly.
═══════════════════════════════════════════ */

const Auth = (() => {

  // Estado local de la UI — solo datos públicos, nunca el token
  let _user = null;

  function getUser()    { return _user; }
  function isLoggedIn() { return !!_user; }

  /* ── Guardar datos públicos del usuario (no el token) ── */
  function _saveUserState(user) {
    _user = user;
    // sessionStorage: datos de UI no sensibles, se borra al cerrar pestaña
    // NO se guarda el token aquí — eso lo maneja el servidor con la cookie
    sessionStorage.setItem('sp_user', JSON.stringify(user));
  }

  function _clearUserState() {
    _user = null;
    sessionStorage.removeItem('sp_user');
  }

  /* ── Mostrar/ocultar pantallas ── */
  function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
    switchAuthTab('login');
  }

  function showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    App.init(_user);
  }

  /* ── Tabs login/registro ── */
  function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.querySelectorAll('.auth-view').forEach(el => {
      el.classList.toggle('active', el.id === 'auth-' + tab);
    });
    _clearAuthErrors();
  }

  function _clearAuthErrors() {
    document.querySelectorAll('.auth-error-box').forEach(el => {
      el.style.display = 'none'; el.textContent = '';
    });
  }

  function _showError(elId, msg) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'flex';
  }

  /* ── LOGIN ── */
  async function doLogin(e) {
    if (e) e.preventDefault();
    _clearAuthErrors();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      _showError('login-error', 'Por favor completa todos los campos.');
      return;
    }

    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.innerHTML = `${spinnerHTML()} Ingresando...`;

    try {
      // El servidor setea la cookie HttpOnly — JS solo recibe datos públicos
      const data = await AuthAPI.login(username, password);
      _saveUserState(data.user); // guarda { id, username, rol_id } — sin token
      showApp();
    } catch (err) {
      _showError('login-error', err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Iniciar sesión';
    }
  }

  /* ── REGISTRO ── */
  async function doRegister(e) {
    if (e) e.preventDefault();
    _clearAuthErrors();

    const username = document.getElementById('reg-username').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirm  = document.getElementById('reg-confirm').value;
    const rol_id   = parseInt(document.getElementById('reg-rol').value);

    if (!username || !email || !password || !confirm || !rol_id) {
      _showError('reg-error', 'Todos los campos son obligatorios.');
      return;
    }
    if (password !== confirm) {
      _showError('reg-error', 'Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      _showError('reg-error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const btn = document.getElementById('btn-register');
    btn.disabled = true;
    btn.innerHTML = `${spinnerHTML()} Registrando...`;

    try {
      await AuthAPI.register(username, email, password, rol_id);
      Toast.success('Cuenta creada correctamente. Inicia sesión.');
      switchAuthTab('login');
      document.getElementById('login-username').value = username;
    } catch (err) {
      _showError('reg-error', err.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Crear cuenta';
    }
  }

  /* ── LOGOUT ── */
  async function logout() {
    try {
      // El servidor limpia la cookie HttpOnly
      await AuthAPI.logout();
    } finally {
      _clearUserState();
      showAuthScreen();
    }
  }

  /* ── Expiración de sesión (inactividad o token vencido) ── */
  function handleSessionExpired(reason) {
    _clearUserState();
    const msg = reason === 'INACTIVITY_TIMEOUT'
      ? 'Tu sesión expiró por inactividad (5 min). Inicia sesión nuevamente.'
      : 'Tu sesión ha expirado. Inicia sesión nuevamente.';

    // Mostrar pantalla de login con mensaje
    showAuthScreen();
    setTimeout(() => {
      const el = document.getElementById('login-error');
      if (el) { el.textContent = msg; el.style.display = 'flex'; }
    }, 200);
  }

  /* ── Toggle contraseña visible/oculta ── */
  function togglePassword(inputId, btnId) {
    const input = document.getElementById(inputId);
    const btn   = document.getElementById(btnId);
    if (!input || !btn) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = show ? Icons.eyeOff : Icons.eye;
  }

  /* ── BOOTSTRAP ── */
  async function init() {
    // Bindings de tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    // Enter en login
    ['login-username', 'login-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') doLogin(e);
      });
    });

    // Toggles de contraseña
    document.getElementById('toggle-login-pass')?.addEventListener('click', () =>
      togglePassword('login-password', 'toggle-login-pass'));
    document.getElementById('toggle-reg-pass')?.addEventListener('click', () =>
      togglePassword('reg-password', 'toggle-reg-pass'));
    document.getElementById('toggle-reg-confirm')?.addEventListener('click', () =>
      togglePassword('reg-confirm', 'toggle-reg-confirm'));

    // RS-04: Verificar sesión activa consultando al servidor.
    // Si la cookie HttpOnly existe y es válida → continuar sesión.
    // Si expiró (por tiempo o inactividad) → el servidor responde 401 → login.
    try {
      const data = await AuthAPI.me();
      _saveUserState(data.user);
      showApp();
    } catch {
      // No hay sesión activa o expiró — mostrar login
      showAuthScreen();
    }
  }

  return {
    init,
    logout,
    doLogin,
    doRegister,
    switchAuthTab,
    getUser,
    isLoggedIn,
    handleSessionExpired,
  };
})();