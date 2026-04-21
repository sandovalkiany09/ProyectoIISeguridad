/* ═══════════════════════════════════════════
   APP — Lógica principal de la aplicación
   Sin style="" inline — todo por clases CSS.
═══════════════════════════════════════════ */

const App = (() => {

  const state = {
    user: null,
    data: { usuarios: [], roles: [], productos: [], auditoria: [] }
  };

  /* ════════════════════════════════════════
     INIT
  ════════════════════════════════════════ */
  function init(user) {
    state.user = user;
    _buildSidebar();
    _bindNav();
    _setUserBadge();
    _applyButtonPermissions();
    _bindDelegatedEvents();
    navigate('dashboard');
  }

  /* ════════════════════════════════════════
     DELEGACIÓN DE EVENTOS (tablas dinámicas)
  ════════════════════════════════════════ */
  function _bindDelegatedEvents() {
    document.getElementById('usuarios-body')
      ?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { action, id, name } = btn.dataset;
        if (action === 'edit-user')   App.editUsuario(parseInt(id));
        if (action === 'delete-user') App.deleteUsuario(parseInt(id), name);
      });

    document.getElementById('roles-body')
      ?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { action, id, name } = btn.dataset;
        if (action === 'edit-role')   App.editRole(parseInt(id));
        if (action === 'delete-role') App.deleteRole(parseInt(id), name);
      });

    document.getElementById('productos-body')
      ?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const { action, id, name } = btn.dataset;
        if (action === 'edit-product')   App.editProducto(parseInt(id));
        if (action === 'delete-product') App.deleteProducto(parseInt(id), name);
      });
  }

  /* ════════════════════════════════════════
     SIDEBAR — visibilidad por rol
     Usa classList en lugar de style.display
  ════════════════════════════════════════ */
  function _buildSidebar() {
    const rolId = state.user.rol_id;
    document.querySelectorAll('.nav-item[data-roles]').forEach(el => {
      const allowed = el.dataset.roles.split(',').map(Number);
      el.classList.toggle('hidden-by-role', !allowed.includes(rolId));
    });
  }

  function _applyButtonPermissions() {
    const rolId = state.user.rol_id;

    const btnNewUser = document.getElementById('btn-new-user');
    if (btnNewUser) btnNewUser.classList.toggle('hidden-by-role', rolId !== 1);

    const btnNewProd = document.getElementById('btn-new-prod');
    if (btnNewProd) btnNewProd.classList.toggle('hidden-by-role', ![1, 3].includes(rolId));
  }

  function _setUserBadge() {
    const u       = state.user;
    const name    = u.username || '—';
    const rolData = ROLE_MAP[u.rol_id] || { name: 'Rol ' + u.rol_id, class: 'badge-neutral' };
    document.getElementById('sb-avatar-letter').textContent = name[0].toUpperCase();
    document.getElementById('sb-name').textContent  = name;
    document.getElementById('sb-role').textContent  = rolData.name;
    document.getElementById('topbar-role').innerHTML =
      `<span class="badge ${rolData.class}">${rolData.name}</span>`;
  }

  /* ════════════════════════════════════════
     NAVEGACIÓN
  ════════════════════════════════════════ */
  const PAGE_META = {
    dashboard: { title: 'Panel de <span>control</span>',      sub: 'Resumen general del sistema' },
    usuarios:  { title: 'Gestión de <span>usuarios</span>',   sub: 'Administración de cuentas' },
    roles:     { title: 'Gestión de <span>roles</span>',      sub: 'Control de acceso basado en roles' },
    productos: { title: 'Catálogo de <span>productos</span>', sub: 'Inventario y gestión de productos' },
    auditoria: { title: 'Registro de <span>auditoría</span>', sub: 'Historial de eventos del sistema' }
  };

  const SECTION_BG = {
    dashboard: 'img/5.jpg',
    usuarios:  'img/1.jpg',
    roles:     'img/2.jpg',
    productos: 'img/3.png',
    auditoria: 'img/4.png'
  };

  function _bindNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.page));
    });
  }

  function navigate(page) {
    // Nav activo
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Vista activa
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const view = document.getElementById('view-' + page);
    if (view) view.classList.add('active');

    // Topbar
    const meta = PAGE_META[page] || { title: page, sub: '' };
    document.getElementById('topbar-title').innerHTML = meta.title;
    document.getElementById('topbar-sub').textContent = meta.sub;

    // Fondo dinámico — usa classList en lugar de style.opacity / style.backgroundImage
    const bg   = document.getElementById('section-bg');
    const tint = document.getElementById('section-bg-tint');
    if (bg) {
      bg.classList.remove('bg-visible');
      if (tint) tint.classList.remove('bg-visible');

      setTimeout(() => {
        // backgroundImage no es un estilo "inline" bloqueado por CSP de style-src
        // porque se aplica vía JS a la propiedad, no como atributo HTML style=""
        bg.style.backgroundImage = `url('${SECTION_BG[page] || SECTION_BG.dashboard}')`;
        bg.classList.add('bg-visible');
        if (tint) tint.classList.add('bg-visible');
      }, 200);
    }

    // Cargar datos
    const loaders = {
      dashboard: loadDashboard,
      usuarios:  loadUsuarios,
      roles:     loadRoles,
      productos: loadProductos,
      auditoria: loadAuditoria
    };
    if (loaders[page]) loaders[page]();
  }

  /* ════════════════════════════════════════
     DASHBOARD
  ════════════════════════════════════════ */
  async function loadDashboard() {
    try {
      const promises = [
        UsuariosAPI.getAll().catch(() => []),
        RolesAPI.getAll().catch(() => []),
        ProductosAPI.getAll().catch(() => [])
      ];
      if (state.user.rol_id === 1) promises.push(AuditoriaAPI.getAll().catch(() => []));
      const [usuarios, roles, productos, logs] = await Promise.all(promises);

      document.getElementById('stat-usuarios').textContent  = usuarios.length;
      document.getElementById('stat-roles').textContent     = roles.length;
      document.getElementById('stat-productos').textContent = productos.length;
      document.getElementById('stat-logs').textContent      = logs ? logs.length : '—';

      const tbody = document.getElementById('dash-log-body');
      if (logs && logs.length) {
        tbody.innerHTML = logs.slice(0, 10).map(l => `
          <tr>
            <td class="td-mono">${l.usuario || '<span class="text-muted">sistema</span>'}</td>
            <td class="td-mono">${l.accion}</td>
            <td class="td-mono">${l.ip || '—'}</td>
            <td class="text-muted td-date">${fmtDate(l.fecha)}</td>
          </tr>`).join('');
      } else {
        tbody.innerHTML = emptyRow(4, 'Sin actividad reciente o sin permisos de auditoría');
      }
    } catch (err) {
      Toast.error('Error al cargar el dashboard: ' + err.message);
    }
  }

  /* ════════════════════════════════════════
     USUARIOS
  ════════════════════════════════════════ */
  async function loadUsuarios() {
    document.getElementById('usuarios-body').innerHTML = loadingRow(6);
    try {
      const data = await UsuariosAPI.getAll();
      state.data.usuarios = data;
      renderUsuarios(data);
    } catch (err) { Toast.error(err.message); }
  }

  function renderUsuarios(rows) {
    const isAdmin = state.user.rol_id === 1;
    document.getElementById('usuarios-body').innerHTML = rows.length
      ? rows.map((u, i) => `
        <tr>
          <td class="td-num">${i + 1}</td>
          <td>
            <div class="td-user-cell">
              <div class="avatar-mini">${u.nombre[0].toUpperCase()}</div>
              <span class="td-username">${u.nombre}</span>
            </div>
          </td>
          <td class="text-soft">${u.email}</td>
          <td>${roleBadge(u.rol_id, u.rol)}</td>
          <td class="text-muted td-date">${fmtDate(u.last_login)}</td>
          <td>
            <div class="td-actions">
              ${isAdmin ? `
                <button class="btn btn-ghost btn-xs"
                  data-action="edit-user" data-id="${u.id}" title="Editar">
                  ${Icons.edit}
                </button>
                <button class="btn btn-danger btn-xs"
                  data-action="delete-user" data-id="${u.id}" data-name="${u.nombre}" title="Eliminar">
                  ${Icons.trash}
                </button>
              ` : '<span class="text-muted">—</span>'}
            </div>
          </td>
        </tr>`).join('')
      : emptyRow(6, 'No hay usuarios registrados');
  }

  async function openNuevoUsuario() {
    await _ensureRoles();
    document.getElementById('modal-user-title').innerHTML = 'Nuevo <span>usuario</span>';
    document.getElementById('edit-user-id').value = '';
    ['u-nombre', 'u-email', 'u-password'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('u-rol').value = '';
    Modal.open('modal-user');
  }

  async function editUsuario(id) {
    await _ensureRoles();
    const u = state.data.usuarios.find(x => x.id === id);
    if (!u) return;
    document.getElementById('modal-user-title').innerHTML = 'Editar <span>usuario</span>';
    document.getElementById('edit-user-id').value = id;
    document.getElementById('u-nombre').value   = u.nombre;
    document.getElementById('u-email').value    = u.email;
    document.getElementById('u-password').value = '';
    document.getElementById('u-rol').value      = u.rol_id;
    Modal.open('modal-user');
  }

  async function saveUsuario() {
    const id  = document.getElementById('edit-user-id').value;
    const rol = parseInt(document.getElementById('u-rol').value);
    const body = {
      nombre:   document.getElementById('u-nombre').value.trim(),
      email:    document.getElementById('u-email').value.trim(),
      password: document.getElementById('u-password').value,
      rol_id:   rol
    };
    if (!body.nombre || !body.email || (!id && !body.password) || !body.rol_id) {
      Toast.warning('Completa todos los campos obligatorios.');
      return;
    }
    if (id && !body.password) delete body.password;
    try {
      if (id) { await UsuariosAPI.update(id, body); Toast.success('Usuario actualizado.'); }
      else     { await UsuariosAPI.create(body);     Toast.success('Usuario creado.'); }
      Modal.close('modal-user');
      loadUsuarios();
    } catch (err) { Toast.error(err.message); }
  }

  async function deleteUsuario(id, name) {
    if (!confirmAction(`¿Eliminar al usuario "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await UsuariosAPI.delete(id);
      Toast.success('Usuario eliminado.');
      loadUsuarios();
    } catch (err) { Toast.error(err.message); }
  }

  /* ════════════════════════════════════════
     ROLES
  ════════════════════════════════════════ */
  async function _ensureRoles() {
    if (!state.data.roles.length) {
      const data = await RolesAPI.getAll().catch(() => []);
      state.data.roles = data;
      _populateRoleSelect(data);
    }
  }

  async function loadRoles() {
    document.getElementById('roles-body').innerHTML = loadingRow(4);
    try {
      const data = await RolesAPI.getAll();
      state.data.roles = data;
      _populateRoleSelect(data);
      renderRoles(data);
    } catch (err) { Toast.error(err.message); }
  }

  function renderRoles(rows) {
    document.getElementById('roles-body').innerHTML = rows.length
      ? rows.map((r, i) => `
        <tr>
          <td class="td-num">${i + 1}</td>
          <td><span class="badge badge-neutral td-mono">#${r.id}</span></td>
          <td class="td-bold">${r.nombre}</td>
          <td>
            <div class="td-actions">
              <button class="btn btn-ghost btn-xs"
                data-action="edit-role" data-id="${r.id}" title="Editar">
                ${Icons.edit}
              </button>
              <button class="btn btn-danger btn-xs"
                data-action="delete-role" data-id="${r.id}" data-name="${r.nombre}" title="Eliminar">
                ${Icons.trash}
              </button>
            </div>
          </td>
        </tr>`).join('')
      : emptyRow(4, 'No hay roles registrados');
  }

  function _populateRoleSelect(roles) {
    const sel = document.getElementById('u-rol');
    if (!sel) return;
    sel.innerHTML = '<option value="">Seleccionar rol...</option>' +
      roles.map(r => `<option value="${r.id}">${r.nombre}</option>`).join('');
  }

  function openNuevoRole() {
    document.getElementById('modal-role-title').innerHTML = 'Nuevo <span>rol</span>';
    document.getElementById('edit-role-id').value = '';
    document.getElementById('r-nombre').value = '';
    Modal.open('modal-role');
  }

  function editRole(id) {
    const r = state.data.roles.find(x => x.id === id);
    if (!r) return;
    document.getElementById('modal-role-title').innerHTML = 'Editar <span>rol</span>';
    document.getElementById('edit-role-id').value = id;
    document.getElementById('r-nombre').value = r.nombre;
    Modal.open('modal-role');
  }

  async function saveRole() {
    const id     = document.getElementById('edit-role-id').value;
    const nombre = document.getElementById('r-nombre').value.trim();
    if (!nombre) { Toast.warning('El nombre del rol es obligatorio.'); return; }
    try {
      if (id) { await RolesAPI.update(id, nombre); Toast.success('Rol actualizado.'); }
      else     { await RolesAPI.create(nombre);     Toast.success('Rol creado.'); }
      Modal.close('modal-role');
      loadRoles();
    } catch (err) { Toast.error(err.message); }
  }

  async function deleteRole(id, name) {
    if (!confirmAction(`¿Eliminar el rol "${name}"?`)) return;
    try {
      await RolesAPI.delete(id);
      Toast.success('Rol eliminado.');
      loadRoles();
    } catch (err) { Toast.error(err.message); }
  }

  /* ════════════════════════════════════════
     PRODUCTOS
  ════════════════════════════════════════ */
  async function loadProductos() {
    document.getElementById('productos-body').innerHTML = loadingRow(7);
    try {
      const data = await ProductosAPI.getAll();
      state.data.productos = data;
      renderProductos(data);
    } catch (err) { Toast.error(err.message); }
  }

  function renderProductos(rows) {
    const rolId   = state.user.rol_id;
    const canEdit = [1, 3].includes(rolId);
    const canDel  = rolId === 1;

    document.getElementById('productos-body').innerHTML = rows.length
      ? rows.map((p, i) => `
        <tr>
          <td class="td-num">${i + 1}</td>
          <td><span class="badge badge-success td-mono">${p.codigo}</span></td>
          <td class="td-bold">${p.nombre}</td>
          <td class="text-muted td-desc">${p.descripcion || '—'}</td>
          <td class="td-right td-bold">${p.cantidad}</td>
          <td class="td-right td-price">${fmtMoney(p.precio)}</td>
          <td>
            <div class="td-actions">
              ${canEdit ? `
                <button class="btn btn-ghost btn-xs"
                  data-action="edit-product" data-id="${p.id}" title="Editar">
                  ${Icons.edit}
                </button>` : ''}
              ${canDel ? `
                <button class="btn btn-danger btn-xs"
                  data-action="delete-product" data-id="${p.id}"
                  data-name="${p.nombre.replace(/'/g, '&#39;')}" title="Eliminar">
                  ${Icons.trash}
                </button>` : ''}
              ${!canEdit && !canDel ? '<span class="text-muted">—</span>' : ''}
            </div>
          </td>
        </tr>`).join('')
      : emptyRow(7, 'No hay productos en el catálogo');
  }

  function openNuevoProducto() {
    document.getElementById('modal-product-title').innerHTML = 'Nuevo <span>producto</span>';
    document.getElementById('edit-prod-id').value = '';
    ['p-codigo', 'p-nombre', 'p-desc', 'p-cantidad', 'p-precio'].forEach(id =>
      document.getElementById(id).value = '');
    Modal.open('modal-product');
  }

  function editProducto(id) {
    const p = state.data.productos.find(x => x.id === id);
    if (!p) return;
    document.getElementById('modal-product-title').innerHTML = 'Editar <span>producto</span>';
    document.getElementById('edit-prod-id').value  = id;
    document.getElementById('p-codigo').value      = p.codigo;
    document.getElementById('p-nombre').value      = p.nombre;
    document.getElementById('p-desc').value        = p.descripcion || '';
    document.getElementById('p-cantidad').value    = p.cantidad;
    document.getElementById('p-precio').value      = p.precio;
    Modal.open('modal-product');
  }

  async function saveProducto() {
    const id = document.getElementById('edit-prod-id').value;
    const body = {
      codigo:      document.getElementById('p-codigo').value.trim(),
      nombre:      document.getElementById('p-nombre').value.trim(),
      descripcion: document.getElementById('p-desc').value.trim(),
      cantidad:    parseInt(document.getElementById('p-cantidad').value) || 0,
      precio:      parseFloat(document.getElementById('p-precio').value) || 0
    };
    if (!body.codigo || !body.nombre) {
      Toast.warning('Código y nombre son obligatorios.');
      return;
    }
    try {
      if (id) { await ProductosAPI.update(id, body); Toast.success('Producto actualizado.'); }
      else     { await ProductosAPI.create(body);     Toast.success('Producto creado.'); }
      Modal.close('modal-product');
      loadProductos();
    } catch (err) { Toast.error(err.message); }
  }

  async function deleteProducto(id, name) {
    if (!confirmAction(`¿Eliminar el producto "${name}"?`)) return;
    try {
      await ProductosAPI.delete(id);
      Toast.success('Producto eliminado.');
      loadProductos();
    } catch (err) { Toast.error(err.message); }
  }

  /* ════════════════════════════════════════
     AUDITORÍA
  ════════════════════════════════════════ */
  async function loadAuditoria() {
    document.getElementById('auditoria-body').innerHTML = loadingRow(5);
    try {
      const data = await AuditoriaAPI.getAll();
      state.data.auditoria = data;
      renderAuditoria(data);
    } catch {
      document.getElementById('auditoria-body').innerHTML =
        emptyRow(5, 'Sin permisos para ver auditoría');
    }
  }

  function renderAuditoria(rows) {
    document.getElementById('auditoria-body').innerHTML = rows.length
      ? rows.map((l, i) => `
        <tr>
          <td class="td-num">${i + 1}</td>
          <td class="td-bold">${l.usuario || '<span class="text-muted">sistema</span>'}</td>
          <td class="td-mono">${l.accion}</td>
          <td class="td-mono">${l.ip || '—'}</td>
          <td class="text-muted td-date">${fmtDate(l.fecha)}</td>
        </tr>`).join('')
      : emptyRow(5, 'No hay registros de auditoría');
  }

  /* ════════════════════════════════════════
     FILTRADO / BÚSQUEDA
  ════════════════════════════════════════ */
  function filterSection(section) {
    const q = document.getElementById('search-' + section)?.value.toLowerCase() || '';
    if (section === 'usuarios') {
      renderUsuarios(state.data.usuarios.filter(u =>
        u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
    } else if (section === 'productos') {
      renderProductos(state.data.productos.filter(p =>
        p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)));
    } else if (section === 'auditoria') {
      renderAuditoria(state.data.auditoria.filter(l =>
        l.accion.toLowerCase().includes(q) || (l.usuario || '').toLowerCase().includes(q)));
    }
  }

  /* ── Exponer métodos públicos ── */
  return {
    init, navigate,
    openNuevoUsuario, editUsuario, saveUsuario, deleteUsuario,
    openNuevoRole,    editRole,    saveRole,    deleteRole,
    openNuevoProducto, editProducto, saveProducto, deleteProducto,
    filterSection
  };
})();