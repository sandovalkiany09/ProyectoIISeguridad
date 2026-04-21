"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteUsuario = exports.patchUsuario = exports.createUsuario = exports.getUsuarios = void 0;

var _db = _interopRequireDefault(require("../config/db.js"));

var _bcrypt = _interopRequireDefault(require("bcrypt"));

var _auditLogger = require("../utils/auditLogger.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * Obtener todos los usuarios
 */
var getUsuarios = function getUsuarios(req, res) {
  var result;
  return regeneratorRuntime.async(function getUsuarios$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(_db["default"].query("\n      SELECT \n        u.id,\n        u.username AS nombre,\n        u.email,\n        u.rol_id,\n        r.nombre AS rol,\n        u.last_login,\n        u.created_at\n      FROM usuarios u\n      JOIN roles r ON u.rol_id = r.id\n      ORDER BY u.id\n    "));

        case 3:
          result = _context.sent;
          res.json(result.rows);
          _context.next = 11;
          break;

        case 7:
          _context.prev = 7;
          _context.t0 = _context["catch"](0);
          console.error('Error al obtener usuarios:', _context.t0);
          res.status(500).json({
            message: 'Error al obtener usuarios'
          });

        case 11:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 7]]);
};
/**
 * Crear usuario (solo admin)
 */


exports.getUsuarios = getUsuarios;

var createUsuario = function createUsuario(req, res) {
  var _req$body, nombre, email, password, rol_id, hashedPassword, result, nuevo;

  return regeneratorRuntime.async(function createUsuario$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _req$body = req.body, nombre = _req$body.nombre, email = _req$body.email, password = _req$body.password, rol_id = _req$body.rol_id;

          if (!(!nombre || !email || !password || !rol_id)) {
            _context2.next = 4;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            message: 'Todos los campos son obligatorios'
          }));

        case 4:
          _context2.next = 6;
          return regeneratorRuntime.awrap(_bcrypt["default"].hash(password, 10));

        case 6:
          hashedPassword = _context2.sent;
          _context2.next = 9;
          return regeneratorRuntime.awrap(_db["default"].query("INSERT INTO usuarios (username, email, password, rol_id)\n       VALUES ($1, $2, $3, $4)\n       RETURNING id, username AS nombre, email, rol_id", [nombre, email, hashedPassword, rol_id]));

        case 9:
          result = _context2.sent;
          // LOG
          nuevo = result.rows[0];
          _context2.next = 13;
          return regeneratorRuntime.awrap((0, _auditLogger.logAuditoria)(req.user.id, "CREATE usuario ID ".concat(nuevo.id), req.ip));

        case 13:
          res.status(201).json(nuevo);
          _context2.next = 22;
          break;

        case 16:
          _context2.prev = 16;
          _context2.t0 = _context2["catch"](0);
          console.error('Error al crear usuario:', _context2.t0);

          if (!(_context2.t0.code === '23505')) {
            _context2.next = 21;
            break;
          }

          return _context2.abrupt("return", res.status(400).json({
            message: 'El email ya está registrado'
          }));

        case 21:
          res.status(500).json({
            message: 'Error al crear usuario'
          });

        case 22:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 16]]);
};
/**
 * Actualizar usuario (PATCH)
 */


exports.createUsuario = createUsuario;

var patchUsuario = function patchUsuario(req, res) {
  var id, _req$body2, nombre, email, password, rol_id, currentUser, oldData, fields, values, index, hashedPassword, query, result, actualizado, cambios;

  return regeneratorRuntime.async(function patchUsuario$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          id = req.params.id;
          _req$body2 = req.body, nombre = _req$body2.nombre, email = _req$body2.email, password = _req$body2.password, rol_id = _req$body2.rol_id; // ── 1. Obtener datos actuales del usuario ─────────────────────

          _context3.next = 5;
          return regeneratorRuntime.awrap(_db["default"].query('SELECT username, email, rol_id FROM usuarios WHERE id = $1', [id]));

        case 5:
          currentUser = _context3.sent;

          if (!(currentUser.rows.length === 0)) {
            _context3.next = 8;
            break;
          }

          return _context3.abrupt("return", res.status(404).json({
            message: 'Usuario no encontrado'
          }));

        case 8:
          oldData = currentUser.rows[0]; // ── 2. Preparar actualización dinámica ───────────────────────

          fields = [];
          values = [];
          index = 1;

          if (nombre !== undefined) {
            fields.push("username = $".concat(index++));
            values.push(nombre);
          }

          if (email !== undefined) {
            fields.push("email = $".concat(index++));
            values.push(email);
          }

          if (!(password !== undefined)) {
            _context3.next = 20;
            break;
          }

          _context3.next = 17;
          return regeneratorRuntime.awrap(_bcrypt["default"].hash(password, 10));

        case 17:
          hashedPassword = _context3.sent;
          fields.push("password = $".concat(index++));
          values.push(hashedPassword);

        case 20:
          if (rol_id !== undefined) {
            fields.push("rol_id = $".concat(index++));
            values.push(rol_id);
          }

          if (!(fields.length === 0)) {
            _context3.next = 23;
            break;
          }

          return _context3.abrupt("return", res.status(400).json({
            message: 'Debe enviar al menos un campo'
          }));

        case 23:
          values.push(id);
          query = "\n      UPDATE usuarios\n      SET ".concat(fields.join(', '), "\n      WHERE id = $").concat(index, "\n      RETURNING id, username AS nombre, email, rol_id\n    ");
          _context3.next = 27;
          return regeneratorRuntime.awrap(_db["default"].query(query, values));

        case 27:
          result = _context3.sent;
          actualizado = result.rows[0]; // ── 3. Detectar cambios reales ───────────────────────────────

          cambios = [];

          if (nombre !== undefined && nombre !== oldData.username) {
            cambios.push("username");
          }

          if (email !== undefined && email !== oldData.email) {
            cambios.push("email");
          }

          if (password !== undefined) {
            cambios.push("password: [ACTUALIZADA]");
          }

          if (rol_id !== undefined && rol_id !== oldData.rol_id) {
            cambios.push("rol_id: ".concat(oldData.rol_id, " \u2192 ").concat(rol_id));
          } // ── 4. Registrar auditoría ───────────────────────────────────


          if (!(cambios.length > 0)) {
            _context3.next = 39;
            break;
          }

          _context3.next = 37;
          return regeneratorRuntime.awrap((0, _auditLogger.logAuditoria)(req.user.id, "UPDATE usuario ID ".concat(actualizado.id, " | Cambios: ").concat(cambios.join(', ')), req.ip));

        case 37:
          _context3.next = 41;
          break;

        case 39:
          _context3.next = 41;
          return regeneratorRuntime.awrap((0, _auditLogger.logAuditoria)(req.user.id, "UPDATE usuario ID ".concat(actualizado.id, " | Sin cambios reales"), req.ip));

        case 41:
          res.json(actualizado);
          _context3.next = 48;
          break;

        case 44:
          _context3.prev = 44;
          _context3.t0 = _context3["catch"](0);
          console.error('Error al actualizar usuario:', _context3.t0);
          res.status(500).json({
            message: 'Error al actualizar usuario'
          });

        case 48:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 44]]);
};
/**
 * Eliminar usuario
 */


exports.patchUsuario = patchUsuario;

var deleteUsuario = function deleteUsuario(req, res) {
  var id, result;
  return regeneratorRuntime.async(function deleteUsuario$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.prev = 0;
          id = req.params.id;
          _context4.next = 4;
          return regeneratorRuntime.awrap(_db["default"].query('DELETE FROM usuarios WHERE id = $1 RETURNING *', [id]));

        case 4:
          result = _context4.sent;

          if (!(result.rows.length === 0)) {
            _context4.next = 7;
            break;
          }

          return _context4.abrupt("return", res.status(404).json({
            message: 'Usuario no encontrado'
          }));

        case 7:
          _context4.next = 9;
          return regeneratorRuntime.awrap((0, _auditLogger.logAuditoria)(req.user.id, "DELETE usuario ID ".concat(id), req.ip));

        case 9:
          res.json({
            message: 'Usuario eliminado'
          });
          _context4.next = 16;
          break;

        case 12:
          _context4.prev = 12;
          _context4.t0 = _context4["catch"](0);
          console.error('Error al eliminar usuario:', _context4.t0);
          res.status(500).json({
            message: 'Error al eliminar usuario'
          });

        case 16:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[0, 12]]);
};

exports.deleteUsuario = deleteUsuario;