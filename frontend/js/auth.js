/* ═══════════════════════════════════════════
   AUTH — Lógica de sesión
   RS-04: NO usa localStorage para el token.
          El estado del usuario (nombre, rol) sí se guarda en sessionStorage
          como datos públicos no sensibles, solo para la UI.
   RS-05: El JWT nunca es accesible desde JS — vive en cookie HttpOnly.
═══════════════════════════════════════════ */

const Auth = (() => {

  let _user = null;

  function getUser()    { return _user; }
  function isLoggedIn() { return !!_user; }

  function _saveUserState(user) {
    _user = user;
    sessionStorage.setItem('sp_user', JSON.stringify(user));
  }

  function _clearUserState() {
    _user = null;
    sessionStorage.removeItem('sp_user');
  }

  /* ── Mostrar/ocultar pantallas ──
     Usa clases CSS en lugar de style="" para cumplir la CSP */
  function showAuthScreen() {
  document.getElementById('auth-screen').classList.remove('auth-screen--hidden');
  document.getElementById('app').classList.add('app-hidden');

  // Limpiar campos al volver al login
  const u = document.getElementById('login-username');
  const p = document.getElementById('login-password');
  if (u) u.value = '';
  if (p) p.value = '';

  switchAuthTab('login');
}

  function showApp() {
  document.getElementById('auth-screen').classList.add('auth-screen--hidden');
  document.getElementById('app').classList.remove('app-hidden');
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
      el.classList.add('alert-hidden');
      el.textContent = '';
    });
  }

  function _showError(elId, msg) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('alert-hidden');
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
      const data = await AuthAPI.login(username, password);
      _saveUserState(data.user);
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
      await AuthAPI.logout();
    } finally {
      _clearUserState();
      showAuthScreen();
    }
  }

  /* ── Expiración de sesión ── */
  function handleSessionExpired(reason) {
    _clearUserState();
    const msg = reason === 'INACTIVITY_TIMEOUT'
      ? 'Tu sesión expiró por inactividad (5 min). Inicia sesión nuevamente.'
      : 'Tu sesión ha expirado. Inicia sesión nuevamente.';

    showAuthScreen();
    setTimeout(() => {
      _showError('login-error', msg);
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
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.addEventListener('click', () => switchAuthTab(tab.dataset.tab));
    });

    ['login-username', 'login-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') doLogin(e);
      });
    });

    document.getElementById('toggle-login-pass')?.addEventListener('click', () =>
      togglePassword('login-password', 'toggle-login-pass'));
    document.getElementById('toggle-reg-pass')?.addEventListener('click', () =>
      togglePassword('reg-password', 'toggle-reg-pass'));
    document.getElementById('toggle-reg-confirm')?.addEventListener('click', () =>
      togglePassword('reg-confirm', 'toggle-reg-confirm'));

    try {
      const data = await AuthAPI.me();
      _saveUserState(data.user);
      showApp();
    } catch {
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