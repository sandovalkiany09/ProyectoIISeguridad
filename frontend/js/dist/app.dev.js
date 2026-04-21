"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/* ═══════════════════════════════════════════
   APP — Lógica principal de la aplicación
   Sin onclick inline — usa delegación de eventos
   para los botones generados dinámicamente.
═══════════════════════════════════════════ */
var App = function () {
  var state = {
    user: null,
    data: {
      usuarios: [],
      roles: [],
      productos: [],
      auditoria: []
    }
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

    _bindDelegatedEvents(); // ← reemplaza todos los onclick dinámicos


    navigate('dashboard');
  }
  /* ════════════════════════════════════════
     DELEGACIÓN DE EVENTOS
     Los botones de editar/eliminar se generan
     dinámicamente en el HTML de las tablas.
     En lugar de onclick inline, usamos un solo
     listener en el tbody de cada tabla.
  ════════════════════════════════════════ */


  function _bindDelegatedEvents() {
    // ─────────────── USUARIOS ───────────────
    var tbodyUsuarios = document.getElementById('usuarios-body');

    if (tbodyUsuarios) {
      tbodyUsuarios.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var _btn$dataset = btn.dataset,
            action = _btn$dataset.action,
            id = _btn$dataset.id,
            name = _btn$dataset.name;

        if (action === 'edit-user') {
          App.editUsuario(parseInt(id));
        } else if (action === 'delete-user') {
          App.deleteUsuario(parseInt(id), name);
        }
      });
    } // ─────────────── ROLES ───────────────


    var tbodyRoles = document.getElementById('roles-body');

    if (tbodyRoles) {
      tbodyRoles.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var _btn$dataset2 = btn.dataset,
            action = _btn$dataset2.action,
            id = _btn$dataset2.id,
            name = _btn$dataset2.name;

        if (action === 'edit-role') {
          App.editRole(parseInt(id));
        } else if (action === 'delete-role') {
          App.deleteRole(parseInt(id), name);
        }
      });
    } // ─────────────── PRODUCTOS ───────────────


    var tbodyProductos = document.getElementById('productos-body');

    if (tbodyProductos) {
      tbodyProductos.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-action]');
        if (!btn) return;
        var _btn$dataset3 = btn.dataset,
            action = _btn$dataset3.action,
            id = _btn$dataset3.id,
            name = _btn$dataset3.name;

        if (action === 'edit-product') {
          App.editProducto(parseInt(id));
        } else if (action === 'delete-product') {
          App.deleteProducto(parseInt(id), name);
        }
      });
    }
  }
  /* ════════════════════════════════════════
     SIDEBAR
  ════════════════════════════════════════ */


  function _buildSidebar() {
    var rolId = state.user.rol_id;
    document.querySelectorAll('.nav-item[data-roles]').forEach(function (el) {
      var allowed = el.dataset.roles.split(',').map(Number);
      el.style.display = allowed.includes(rolId) ? '' : 'none';
    });
  }

  function _applyButtonPermissions() {
    var rolId = state.user.rol_id; // Solo superadmin (1) puede crear usuarios

    var btnNewUser = document.getElementById('btn-new-user');
    if (btnNewUser) btnNewUser.style.display = rolId === 1 ? '' : 'none'; // Superadmin (1) y registrador (3) pueden crear productos

    var btnNewProd = document.getElementById('btn-new-prod');
    if (btnNewProd) btnNewProd.style.display = [1, 3].includes(rolId) ? '' : 'none';
  }

  function _setUserBadge() {
    var u = state.user;
    var name = u.username || '—';
    var rolData = ROLE_MAP[u.rol_id] || {
      name: 'Rol ' + u.rol_id,
      "class": 'badge-neutral'
    };
    document.getElementById('sb-avatar-letter').textContent = name[0].toUpperCase();
    document.getElementById('sb-name').textContent = name;
    document.getElementById('sb-role').textContent = rolData.name;
    document.getElementById('topbar-role').innerHTML = "<span class=\"badge ".concat(rolData["class"], "\">").concat(rolData.name, "</span>");
  }
  /* ════════════════════════════════════════
     NAVEGACIÓN
  ════════════════════════════════════════ */


  var PAGE_META = {
    dashboard: {
      title: 'Panel de <span>control</span>',
      sub: 'Resumen general del sistema'
    },
    usuarios: {
      title: 'Gestión de <span>usuarios</span>',
      sub: 'Administración de cuentas'
    },
    roles: {
      title: 'Gestión de <span>roles</span>',
      sub: 'Control de acceso basado en roles'
    },
    productos: {
      title: 'Catálogo de <span>productos</span>',
      sub: 'Inventario y gestión de productos'
    },
    auditoria: {
      title: 'Registro de <span>auditoría</span>',
      sub: 'Historial de eventos del sistema'
    }
  };
  var SECTION_BG = {
    dashboard: 'img/5.jpg',
    usuarios: 'img/1.jpg',
    roles: 'img/2.jpg',
    productos: 'img/3.png',
    auditoria: 'img/4.png'
  };

  function _bindNav() {
    document.querySelectorAll('.nav-item[data-page]').forEach(function (el) {
      el.addEventListener('click', function () {
        return navigate(el.dataset.page);
      });
    });
  }

  function navigate(page) {
    // Nav activo
    document.querySelectorAll('.nav-item').forEach(function (el) {
      el.classList.toggle('active', el.dataset.page === page);
    }); // Vista activa

    document.querySelectorAll('.view').forEach(function (v) {
      return v.classList.remove('active');
    });
    var view = document.getElementById('view-' + page);
    if (view) view.classList.add('active'); // Topbar

    var meta = PAGE_META[page] || {
      title: page,
      sub: ''
    };
    document.getElementById('topbar-title').innerHTML = meta.title;
    document.getElementById('topbar-sub').textContent = meta.sub; // Fondo dinámico

    var bg = document.getElementById('section-bg');
    var tint = document.getElementById('section-bg-tint');

    if (bg) {
      bg.style.opacity = 0;
      if (tint) tint.style.opacity = 0;
      setTimeout(function () {
        bg.style.backgroundImage = "url('".concat(SECTION_BG[page] || SECTION_BG.dashboard, "')");
        bg.style.opacity = 1;
        if (tint) tint.style.opacity = 1;
      }, 200);
    } // Cargar datos


    var loaders = {
      dashboard: loadDashboard,
      usuarios: loadUsuarios,
      roles: loadRoles,
      productos: loadProductos,
      auditoria: loadAuditoria
    };
    if (loaders[page]) loaders[page]();
  }
  /* ════════════════════════════════════════
     DASHBOARD
  ════════════════════════════════════════ */


  function loadDashboard() {
    var promises, _ref, _ref2, usuarios, roles, productos, logs, tbody;

    return regeneratorRuntime.async(function loadDashboard$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            promises = [UsuariosAPI.getAll()["catch"](function () {
              return [];
            }), RolesAPI.getAll()["catch"](function () {
              return [];
            }), ProductosAPI.getAll()["catch"](function () {
              return [];
            })];

            if (state.user.rol_id === 1) {
              promises.push(AuditoriaAPI.getAll()["catch"](function () {
                return [];
              }));
            }

            _context.next = 5;
            return regeneratorRuntime.awrap(Promise.all(promises));

          case 5:
            _ref = _context.sent;
            _ref2 = _slicedToArray(_ref, 4);
            usuarios = _ref2[0];
            roles = _ref2[1];
            productos = _ref2[2];
            logs = _ref2[3];
            document.getElementById('stat-usuarios').textContent = usuarios.length;
            document.getElementById('stat-roles').textContent = roles.length;
            document.getElementById('stat-productos').textContent = productos.length;
            document.getElementById('stat-logs').textContent = logs ? logs.length : '—';
            tbody = document.getElementById('dash-log-body');

            if (logs && logs.length) {
              tbody.innerHTML = logs.slice(0, 10).map(function (l) {
                return "\n          <tr>\n            <td><span class=\"td-mono\">".concat(l.usuario || '<span class="text-muted">sistema</span>', "</span></td>\n            <td class=\"td-mono\">").concat(l.accion, "</td>\n            <td class=\"td-mono\">").concat(l.ip || '—', "</td>\n            <td style=\"color:var(--text-400);font-size:0.8rem\">").concat(fmtDate(l.fecha), "</td>\n          </tr>");
              }).join('');
            } else {
              tbody.innerHTML = emptyRow(4, 'Sin actividad reciente o sin permisos de auditoría');
            }

            _context.next = 22;
            break;

          case 19:
            _context.prev = 19;
            _context.t0 = _context["catch"](0);
            Toast.error('Error al cargar el dashboard: ' + _context.t0.message);

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[0, 19]]);
  }
  /* ════════════════════════════════════════
     USUARIOS
  ════════════════════════════════════════ */


  function loadUsuarios() {
    var data;
    return regeneratorRuntime.async(function loadUsuarios$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            document.getElementById('usuarios-body').innerHTML = loadingRow(6);
            _context2.prev = 1;
            _context2.next = 4;
            return regeneratorRuntime.awrap(UsuariosAPI.getAll());

          case 4:
            data = _context2.sent;
            state.data.usuarios = data;
            renderUsuarios(data);
            _context2.next = 12;
            break;

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2["catch"](1);
            Toast.error(_context2.t0.message);

          case 12:
          case "end":
            return _context2.stop();
        }
      }
    }, null, null, [[1, 9]]);
  }

  function renderUsuarios(rows) {
    var isAdmin = state.user.rol_id === 1;
    document.getElementById('usuarios-body').innerHTML = rows.length ? rows.map(function (u, i) {
      return "\n        <tr>\n          <td style=\"color:var(--text-400)\">".concat(i + 1, "</td>\n          <td>\n            <div style=\"display:flex;align-items:center;gap:10px\">\n              <div style=\"width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--c-royal),var(--c-sky));display:grid;place-items:center;font-size:0.75rem;font-weight:700;flex-shrink:0\">\n                ").concat(u.nombre[0].toUpperCase(), "\n              </div>\n              <span style=\"font-weight:500\">").concat(u.nombre, "</span>\n            </div>\n          </td>\n          <td style=\"color:var(--text-300)\">").concat(u.email, "</td>\n          <td>").concat(roleBadge(u.rol_id, u.rol), "</td>\n          <td style=\"color:var(--text-400);font-size:0.8rem\">").concat(fmtDate(u.last_login), "</td>\n          <td>\n            <div class=\"td-actions\">\n              ").concat(isAdmin ? "\n                <button class=\"btn btn-ghost btn-xs\"\n                  data-action=\"edit-user\" data-id=\"".concat(u.id, "\" title=\"Editar\">\n                  ").concat(Icons.edit, "\n                </button>\n                <button class=\"btn btn-danger btn-xs\"\n                  data-action=\"delete-user\" data-id=\"").concat(u.id, "\" data-name=\"").concat(u.nombre, "\" title=\"Eliminar\">\n                  ").concat(Icons.trash, "\n                </button>") : '<span style="color:var(--text-400)">—</span>', "\n            </div>\n          </td>\n        </tr>");
    }).join('') : emptyRow(6, 'No hay usuarios registrados');
  }

  function openNuevoUsuario() {
    return regeneratorRuntime.async(function openNuevoUsuario$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return regeneratorRuntime.awrap(loadRoles());

          case 2:
            document.getElementById('modal-user-title').innerHTML = 'Nuevo <span>usuario</span>';
            document.getElementById('edit-user-id').value = '';
            ['u-nombre', 'u-email', 'u-password'].forEach(function (id) {
              return document.getElementById(id).value = '';
            });
            document.getElementById('u-rol').value = '';
            Modal.open('modal-user');

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    });
  }

  function editUsuario(id) {
    var u;
    return regeneratorRuntime.async(function editUsuario$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return regeneratorRuntime.awrap(loadRoles());

          case 2:
            u = state.data.usuarios.find(function (x) {
              return x.id === id;
            });

            if (u) {
              _context4.next = 5;
              break;
            }

            return _context4.abrupt("return");

          case 5:
            document.getElementById('modal-user-title').innerHTML = 'Editar <span>usuario</span>';
            document.getElementById('edit-user-id').value = id;
            document.getElementById('u-nombre').value = u.nombre;
            document.getElementById('u-email').value = u.email;
            document.getElementById('u-password').value = '';
            document.getElementById('u-rol').value = u.rol_id;
            Modal.open('modal-user');

          case 12:
          case "end":
            return _context4.stop();
        }
      }
    });
  }

  function saveUsuario() {
    var id, rol, body;
    return regeneratorRuntime.async(function saveUsuario$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            id = document.getElementById('edit-user-id').value;
            rol = parseInt(document.getElementById('u-rol').value);
            body = {
              nombre: document.getElementById('u-nombre').value.trim(),
              email: document.getElementById('u-email').value.trim(),
              password: document.getElementById('u-password').value,
              rol_id: rol
            };

            if (!(!body.nombre || !body.email || !id && !body.password || !body.rol_id)) {
              _context5.next = 6;
              break;
            }

            Toast.warning('Completa todos los campos obligatorios.');
            return _context5.abrupt("return");

          case 6:
            if (id && !body.password) delete body.password;
            _context5.prev = 7;

            if (!id) {
              _context5.next = 14;
              break;
            }

            _context5.next = 11;
            return regeneratorRuntime.awrap(UsuariosAPI.update(id, body));

          case 11:
            Toast.success('Usuario actualizado correctamente.');
            _context5.next = 17;
            break;

          case 14:
            _context5.next = 16;
            return regeneratorRuntime.awrap(UsuariosAPI.create(body));

          case 16:
            Toast.success('Usuario creado correctamente.');

          case 17:
            Modal.close('modal-user');
            loadUsuarios();
            _context5.next = 24;
            break;

          case 21:
            _context5.prev = 21;
            _context5.t0 = _context5["catch"](7);
            Toast.error(_context5.t0.message);

          case 24:
          case "end":
            return _context5.stop();
        }
      }
    }, null, null, [[7, 21]]);
  }

  function deleteUsuario(id, name) {
    return regeneratorRuntime.async(function deleteUsuario$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            if (confirmAction("\xBFEliminar al usuario \"".concat(name, "\"? Esta acci\xF3n no se puede deshacer."))) {
              _context6.next = 2;
              break;
            }

            return _context6.abrupt("return");

          case 2:
            _context6.prev = 2;
            _context6.next = 5;
            return regeneratorRuntime.awrap(UsuariosAPI["delete"](id));

          case 5:
            Toast.success('Usuario eliminado.');
            loadUsuarios();
            _context6.next = 12;
            break;

          case 9:
            _context6.prev = 9;
            _context6.t0 = _context6["catch"](2);
            Toast.error(_context6.t0.message);

          case 12:
          case "end":
            return _context6.stop();
        }
      }
    }, null, null, [[2, 9]]);
  }
  /* ════════════════════════════════════════
     ROLES
  ════════════════════════════════════════ */


  function loadRoles() {
    var data;
    return regeneratorRuntime.async(function loadRoles$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            document.getElementById('roles-body').innerHTML = loadingRow(4);
            _context7.prev = 1;
            _context7.next = 4;
            return regeneratorRuntime.awrap(RolesAPI.getAll());

          case 4:
            data = _context7.sent;
            state.data.roles = data;

            _populateRoleSelect(data);

            renderRoles(data);
            _context7.next = 13;
            break;

          case 10:
            _context7.prev = 10;
            _context7.t0 = _context7["catch"](1);
            Toast.error(_context7.t0.message);

          case 13:
          case "end":
            return _context7.stop();
        }
      }
    }, null, null, [[1, 10]]);
  }

  function renderRoles(rows) {
    document.getElementById('roles-body').innerHTML = rows.length ? rows.map(function (r, i) {
      return "\n        <tr>\n          <td style=\"color:var(--text-400)\">".concat(i + 1, "</td>\n          <td><span class=\"badge badge-neutral td-mono\">#").concat(r.id, "</span></td>\n          <td style=\"font-weight:500\">").concat(r.nombre, "</td>\n          <td>\n            <div class=\"td-actions\">\n              <button class=\"btn btn-ghost btn-xs\"\n                data-action=\"edit-role\" data-id=\"").concat(r.id, "\" title=\"Editar\">\n                ").concat(Icons.edit, "\n              </button>\n              <button class=\"btn btn-danger btn-xs\"\n                data-action=\"delete-role\" data-id=\"").concat(r.id, "\" data-name=\"").concat(r.nombre, "\" title=\"Eliminar\">\n                ").concat(Icons.trash, "\n              </button>\n            </div>\n          </td>\n        </tr>");
    }).join('') : emptyRow(4, 'No hay roles registrados');
  }

  function _populateRoleSelect(roles) {
    ['u-rol'].forEach(function (selId) {
      var sel = document.getElementById(selId);
      if (!sel) return;
      sel.innerHTML = '<option value="">Seleccionar rol...</option>' + roles.map(function (r) {
        return "<option value=\"".concat(r.id, "\">").concat(r.nombre, "</option>");
      }).join('');
    });
  }

  function openNuevoRole() {
    document.getElementById('modal-role-title').innerHTML = 'Nuevo <span>rol</span>';
    document.getElementById('edit-role-id').value = '';
    document.getElementById('r-nombre').value = '';
    Modal.open('modal-role');
  }

  function editRole(id) {
    var r = state.data.roles.find(function (x) {
      return x.id === id;
    });
    if (!r) return;
    document.getElementById('modal-role-title').innerHTML = 'Editar <span>rol</span>';
    document.getElementById('edit-role-id').value = id;
    document.getElementById('r-nombre').value = r.nombre;
    Modal.open('modal-role');
  }

  function saveRole() {
    var id, nombre;
    return regeneratorRuntime.async(function saveRole$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            id = document.getElementById('edit-role-id').value;
            nombre = document.getElementById('r-nombre').value.trim();

            if (nombre) {
              _context8.next = 5;
              break;
            }

            Toast.warning('El nombre del rol es obligatorio.');
            return _context8.abrupt("return");

          case 5:
            _context8.prev = 5;

            if (!id) {
              _context8.next = 12;
              break;
            }

            _context8.next = 9;
            return regeneratorRuntime.awrap(RolesAPI.update(id, nombre));

          case 9:
            Toast.success('Rol actualizado.');
            _context8.next = 15;
            break;

          case 12:
            _context8.next = 14;
            return regeneratorRuntime.awrap(RolesAPI.create(nombre));

          case 14:
            Toast.success('Rol creado.');

          case 15:
            Modal.close('modal-role');
            loadRoles();
            _context8.next = 22;
            break;

          case 19:
            _context8.prev = 19;
            _context8.t0 = _context8["catch"](5);
            Toast.error(_context8.t0.message);

          case 22:
          case "end":
            return _context8.stop();
        }
      }
    }, null, null, [[5, 19]]);
  }

  function deleteRole(id, name) {
    return regeneratorRuntime.async(function deleteRole$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            if (confirmAction("\xBFEliminar el rol \"".concat(name, "\"?"))) {
              _context9.next = 2;
              break;
            }

            return _context9.abrupt("return");

          case 2:
            _context9.prev = 2;
            _context9.next = 5;
            return regeneratorRuntime.awrap(RolesAPI["delete"](id));

          case 5:
            Toast.success('Rol eliminado.');
            loadRoles();
            _context9.next = 12;
            break;

          case 9:
            _context9.prev = 9;
            _context9.t0 = _context9["catch"](2);
            Toast.error(_context9.t0.message);

          case 12:
          case "end":
            return _context9.stop();
        }
      }
    }, null, null, [[2, 9]]);
  }
  /* ════════════════════════════════════════
     PRODUCTOS
  ════════════════════════════════════════ */


  function loadProductos() {
    var data;
    return regeneratorRuntime.async(function loadProductos$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            document.getElementById('productos-body').innerHTML = loadingRow(7);
            _context10.prev = 1;
            _context10.next = 4;
            return regeneratorRuntime.awrap(ProductosAPI.getAll());

          case 4:
            data = _context10.sent;
            state.data.productos = data;
            renderProductos(data);
            _context10.next = 12;
            break;

          case 9:
            _context10.prev = 9;
            _context10.t0 = _context10["catch"](1);
            Toast.error(_context10.t0.message);

          case 12:
          case "end":
            return _context10.stop();
        }
      }
    }, null, null, [[1, 9]]);
  }

  function renderProductos(rows) {
    var rolId = state.user.rol_id;
    var canEdit = [1, 3].includes(rolId);
    var canDel = rolId === 1;
    document.getElementById('productos-body').innerHTML = rows.length ? rows.map(function (p, i) {
      return "\n        <tr>\n          <td style=\"color:var(--text-400)\">".concat(i + 1, "</td>\n          <td><span class=\"badge badge-success td-mono\">").concat(p.codigo, "</span></td>\n          <td style=\"font-weight:500\">").concat(p.nombre, "</td>\n          <td style=\"color:var(--text-400);font-size:0.82rem;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap\">\n            ").concat(p.descripcion || '—', "\n          </td>\n          <td style=\"font-weight:600;text-align:right\">").concat(p.cantidad, "</td>\n          <td style=\"color:var(--success);font-weight:600;text-align:right\">").concat(fmtMoney(p.precio), "</td>\n          <td>\n            <div class=\"td-actions\">\n              ").concat(canEdit ? "<button class=\"btn btn-ghost btn-xs\"\n                data-action=\"edit-product\" data-id=\"".concat(p.id, "\" title=\"Editar\">\n                ").concat(Icons.edit, "</button>") : '', "\n              ").concat(canDel ? "<button class=\"btn btn-danger btn-xs\"\n                data-action=\"delete-product\" data-id=\"".concat(p.id, "\" data-name=\"").concat(p.nombre.replace(/'/g, '&#39;'), "\" title=\"Eliminar\">\n                ").concat(Icons.trash, "</button>") : '', "\n              ").concat(!canEdit && !canDel ? '<span style="color:var(--text-400)">—</span>' : '', "\n            </div>\n          </td>\n        </tr>");
    }).join('') : emptyRow(7, 'No hay productos en el catálogo');
  }

  function openNuevoProducto() {
    document.getElementById('modal-product-title').innerHTML = 'Nuevo <span>producto</span>';
    document.getElementById('edit-prod-id').value = '';
    ['p-codigo', 'p-nombre', 'p-desc', 'p-cantidad', 'p-precio'].forEach(function (id) {
      return document.getElementById(id).value = '';
    });
    Modal.open('modal-product');
  }

  function editProducto(id) {
    var p = state.data.productos.find(function (x) {
      return x.id === id;
    });
    if (!p) return;
    document.getElementById('modal-product-title').innerHTML = 'Editar <span>producto</span>';
    document.getElementById('edit-prod-id').value = id;
    document.getElementById('p-codigo').value = p.codigo;
    document.getElementById('p-nombre').value = p.nombre;
    document.getElementById('p-desc').value = p.descripcion || '';
    document.getElementById('p-cantidad').value = p.cantidad;
    document.getElementById('p-precio').value = p.precio;
    Modal.open('modal-product');
  }

  function saveProducto() {
    var id, body;
    return regeneratorRuntime.async(function saveProducto$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            id = document.getElementById('edit-prod-id').value;
            body = {
              codigo: document.getElementById('p-codigo').value.trim(),
              nombre: document.getElementById('p-nombre').value.trim(),
              descripcion: document.getElementById('p-desc').value.trim(),
              cantidad: parseInt(document.getElementById('p-cantidad').value) || 0,
              precio: parseFloat(document.getElementById('p-precio').value) || 0
            };

            if (!(!body.codigo || !body.nombre)) {
              _context11.next = 5;
              break;
            }

            Toast.warning('Código y nombre son obligatorios.');
            return _context11.abrupt("return");

          case 5:
            _context11.prev = 5;

            if (!id) {
              _context11.next = 12;
              break;
            }

            _context11.next = 9;
            return regeneratorRuntime.awrap(ProductosAPI.update(id, body));

          case 9:
            Toast.success('Producto actualizado.');
            _context11.next = 15;
            break;

          case 12:
            _context11.next = 14;
            return regeneratorRuntime.awrap(ProductosAPI.create(body));

          case 14:
            Toast.success('Producto creado.');

          case 15:
            Modal.close('modal-product');
            loadProductos();
            _context11.next = 22;
            break;

          case 19:
            _context11.prev = 19;
            _context11.t0 = _context11["catch"](5);
            Toast.error(_context11.t0.message);

          case 22:
          case "end":
            return _context11.stop();
        }
      }
    }, null, null, [[5, 19]]);
  }

  function deleteProducto(id, name) {
    return regeneratorRuntime.async(function deleteProducto$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            if (confirmAction("\xBFEliminar el producto \"".concat(name, "\"?"))) {
              _context12.next = 2;
              break;
            }

            return _context12.abrupt("return");

          case 2:
            _context12.prev = 2;
            _context12.next = 5;
            return regeneratorRuntime.awrap(ProductosAPI["delete"](id));

          case 5:
            Toast.success('Producto eliminado.');
            loadProductos();
            _context12.next = 12;
            break;

          case 9:
            _context12.prev = 9;
            _context12.t0 = _context12["catch"](2);
            Toast.error(_context12.t0.message);

          case 12:
          case "end":
            return _context12.stop();
        }
      }
    }, null, null, [[2, 9]]);
  }
  /* ════════════════════════════════════════
     AUDITORÍA
  ════════════════════════════════════════ */


  function loadAuditoria() {
    var data;
    return regeneratorRuntime.async(function loadAuditoria$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            document.getElementById('auditoria-body').innerHTML = loadingRow(5);
            _context13.prev = 1;
            _context13.next = 4;
            return regeneratorRuntime.awrap(AuditoriaAPI.getAll());

          case 4:
            data = _context13.sent;
            state.data.auditoria = data;
            renderAuditoria(data);
            _context13.next = 12;
            break;

          case 9:
            _context13.prev = 9;
            _context13.t0 = _context13["catch"](1);
            document.getElementById('auditoria-body').innerHTML = emptyRow(5, 'Sin permisos para ver auditoría');

          case 12:
          case "end":
            return _context13.stop();
        }
      }
    }, null, null, [[1, 9]]);
  }

  function renderAuditoria(rows) {
    document.getElementById('auditoria-body').innerHTML = rows.length ? rows.map(function (l, i) {
      return "\n        <tr>\n          <td style=\"color:var(--text-400)\">".concat(i + 1, "</td>\n          <td style=\"font-weight:500\">").concat(l.usuario || '<span class="text-muted">sistema</span>', "</td>\n          <td class=\"td-mono\">").concat(l.accion, "</td>\n          <td class=\"td-mono\">").concat(l.ip || '—', "</td>\n          <td style=\"color:var(--text-400);font-size:0.8rem\">").concat(fmtDate(l.fecha), "</td>\n        </tr>");
    }).join('') : emptyRow(5, 'No hay registros de auditoría');
  }
  /* ════════════════════════════════════════
     FILTRADO / BÚSQUEDA
  ════════════════════════════════════════ */


  function filterSection(section) {
    var input = document.getElementById('search-' + section);
    var q = input ? input.value.toLowerCase() : '';

    if (section === 'usuarios') {
      renderUsuarios(state.data.usuarios.filter(function (u) {
        return u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }));
    } else if (section === 'productos') {
      renderProductos(state.data.productos.filter(function (p) {
        return p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q);
      }));
    } else if (section === 'auditoria') {
      renderAuditoria(state.data.auditoria.filter(function (l) {
        return l.accion.toLowerCase().includes(q) || (l.usuario || '').toLowerCase().includes(q);
      }));
    }
  }
  /* ── Exponer métodos públicos ── */


  return {
    init: init,
    navigate: navigate,
    openNuevoUsuario: openNuevoUsuario,
    editUsuario: editUsuario,
    saveUsuario: saveUsuario,
    deleteUsuario: deleteUsuario,
    openNuevoRole: openNuevoRole,
    editRole: editRole,
    saveRole: saveRole,
    deleteRole: deleteRole,
    openNuevoProducto: openNuevoProducto,
    editProducto: editProducto,
    saveProducto: saveProducto,
    deleteProducto: deleteProducto,
    filterSection: filterSection
  };
}();