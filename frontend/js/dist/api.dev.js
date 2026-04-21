"use strict";

/* ═══════════════════════════════════════════
   API CLIENT
   RS-04/RS-05: El JWT vive en una cookie HttpOnly.
   El navegador la envía automáticamente con credentials:'include'.
   Este archivo NUNCA lee ni escribe localStorage con tokens.
═══════════════════════════════════════════ */
var API_BASE = '/api';
var AUTH_BASE = '/api/auth';
/**
 * Cliente HTTP base.
 * credentials: 'include' hace que el navegador adjunte automáticamente
 * la cookie HttpOnly en cada request — sin que JS toque el token.
 */

function apiRequest(method, url) {
  var body,
      options,
      res,
      _data,
      data,
      _args = arguments;

  return regeneratorRuntime.async(function apiRequest$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          body = _args.length > 2 && _args[2] !== undefined ? _args[2] : null;
          options = {
            method: method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          };
          if (body) options.body = JSON.stringify(body);
          _context.next = 5;
          return regeneratorRuntime.awrap(fetch(url, options));

        case 5:
          res = _context.sent;

          if (!(res.status === 401)) {
            _context.next = 12;
            break;
          }

          _context.next = 9;
          return regeneratorRuntime.awrap(res.json()["catch"](function () {
            return {};
          }));

        case 9:
          _data = _context.sent;
          Auth.handleSessionExpired(_data.reason);
          throw new Error(_data.message || 'Sesión expirada');

        case 12:
          _context.next = 14;
          return regeneratorRuntime.awrap(res.json()["catch"](function () {
            return {};
          }));

        case 14:
          data = _context.sent;

          if (res.ok) {
            _context.next = 17;
            break;
          }

          throw new Error(data.message || "Error ".concat(res.status));

        case 17:
          return _context.abrupt("return", data);

        case 18:
        case "end":
          return _context.stop();
      }
    }
  });
}

var AuthAPI = {
  login: function login(username, password) {
    return fetch(AUTH_BASE + '/login', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    }).then(function _callee(res) {
      var data;
      return regeneratorRuntime.async(function _callee$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return regeneratorRuntime.awrap(res.json());

            case 2:
              data = _context2.sent;

              if (res.ok) {
                _context2.next = 5;
                break;
              }

              throw new Error(data.message || 'Credenciales inválidas');

            case 5:
              return _context2.abrupt("return", data);

            case 6:
            case "end":
              return _context2.stop();
          }
        }
      });
    });
  },
  register: function register(username, email, password, rol_id) {
    return fetch(AUTH_BASE + '/register', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
        rol_id: rol_id
      })
    }).then(function _callee2(res) {
      var data;
      return regeneratorRuntime.async(function _callee2$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return regeneratorRuntime.awrap(res.json());

            case 2:
              data = _context3.sent;

              if (res.ok) {
                _context3.next = 5;
                break;
              }

              throw new Error(data.message || 'Error al registrar');

            case 5:
              return _context3.abrupt("return", data);

            case 6:
            case "end":
              return _context3.stop();
          }
        }
      });
    });
  },
  logout: function logout() {
    return fetch(AUTH_BASE + '/logout', {
      method: 'POST',
      credentials: 'include'
    })["catch"](function () {});
  },
  me: function me() {
    return fetch(AUTH_BASE + '/me', {
      method: 'GET',
      credentials: 'include'
    }).then(function _callee3(res) {
      var data;
      return regeneratorRuntime.async(function _callee3$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return regeneratorRuntime.awrap(res.json());

            case 2:
              data = _context4.sent;

              if (res.ok) {
                _context4.next = 5;
                break;
              }

              throw new Error(data.message || 'Sin sesión');

            case 5:
              return _context4.abrupt("return", data);

            case 6:
            case "end":
              return _context4.stop();
          }
        }
      });
    });
  }
};
var UsuariosAPI = {
  getAll: function getAll() {
    return apiRequest('GET', API_BASE + '/usuarios');
  },
  create: function create(body) {
    return apiRequest('POST', API_BASE + '/usuarios', body);
  },
  update: function update(id, body) {
    return apiRequest('PATCH', API_BASE + '/usuarios/' + id, body);
  },
  "delete": function _delete(id) {
    return apiRequest('DELETE', API_BASE + '/usuarios/' + id);
  }
};
var RolesAPI = {
  getAll: function getAll() {
    return apiRequest('GET', API_BASE + '/roles');
  },
  create: function create(nombre) {
    return apiRequest('POST', API_BASE + '/roles', {
      nombre: nombre
    });
  },
  update: function update(id, nombre) {
    return apiRequest('PATCH', API_BASE + '/roles/' + id, {
      nombre: nombre
    });
  },
  "delete": function _delete(id) {
    return apiRequest('DELETE', API_BASE + '/roles/' + id);
  }
};
var ProductosAPI = {
  getAll: function getAll() {
    return apiRequest('GET', API_BASE + '/productos');
  },
  create: function create(body) {
    return apiRequest('POST', API_BASE + '/productos', body);
  },
  update: function update(id, body) {
    return apiRequest('PATCH', API_BASE + '/productos/' + id, body);
  },
  "delete": function _delete(id) {
    return apiRequest('DELETE', API_BASE + '/productos/' + id);
  }
};
var AuditoriaAPI = {
  getAll: function getAll() {
    return apiRequest('GET', API_BASE + '/auditoria');
  }
};