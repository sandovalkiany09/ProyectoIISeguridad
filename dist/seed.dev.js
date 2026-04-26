"use strict";

var _pg = _interopRequireDefault(require("pg"));

var _bcrypt = _interopRequireDefault(require("bcrypt"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// seed.js
var Pool = _pg["default"].Pool;

function createDatabase() {
  var adminPool, client, res;
  return regeneratorRuntime.async(function createDatabase$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // Conectar a 'postgres' (siempre existe) para crear la BD
          adminPool = new Pool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'postgres',
            // 👈 BD por defecto
            port: 5432
          });
          _context.next = 3;
          return regeneratorRuntime.awrap(adminPool.connect());

        case 3:
          client = _context.sent;
          _context.prev = 4;
          _context.next = 7;
          return regeneratorRuntime.awrap(client.query("SELECT 1 FROM pg_database WHERE datname = 'proyecto_seguridad'"));

        case 7:
          res = _context.sent;

          if (!(res.rowCount === 0)) {
            _context.next = 14;
            break;
          }

          _context.next = 11;
          return regeneratorRuntime.awrap(client.query("CREATE DATABASE proyecto_seguridad"));

        case 11:
          console.log('✅ Base de datos creada');
          _context.next = 15;
          break;

        case 14:
          console.log('ℹ️ La base de datos ya existe');

        case 15:
          _context.prev = 15;
          client.release();
          _context.next = 19;
          return regeneratorRuntime.awrap(adminPool.end());

        case 19:
          return _context.finish(15);

        case 20:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[4,, 15, 20]]);
}

function seed() {
  var pool, client, hashedPassword;
  return regeneratorRuntime.async(function seed$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(createDatabase());

        case 2:
          // 👈 Crear BD antes de conectarse a ella
          pool = new Pool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: 5432
          });
          _context2.next = 5;
          return regeneratorRuntime.awrap(pool.connect());

        case 5:
          client = _context2.sent;
          _context2.prev = 6;
          console.log('🌱 Ejecutando seed...');
          _context2.next = 10;
          return regeneratorRuntime.awrap(_bcrypt["default"].hash('123456', 12));

        case 10:
          hashedPassword = _context2.sent;
          _context2.next = 13;
          return regeneratorRuntime.awrap(client.query("\n      INSERT INTO usuarios (username, password, email, rol_id)\n      VALUES ($1, $2, $3, $4)\n      ON CONFLICT (username) DO NOTHING\n    ", ['superadmin', hashedPassword, 'superadmin@sistema.com', 1]));

        case 13:
          console.log('✅ Usuario superadmin creado correctamente');
          _context2.next = 20;
          break;

        case 16:
          _context2.prev = 16;
          _context2.t0 = _context2["catch"](6);
          console.error('❌ Error en seed:', _context2.t0.message);
          process.exit(1);

        case 20:
          _context2.prev = 20;
          client.release();
          _context2.next = 24;
          return regeneratorRuntime.awrap(pool.end());

        case 24:
          return _context2.finish(20);

        case 25:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[6, 16, 20, 25]]);
}

seed();