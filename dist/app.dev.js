"use strict";

var express = require('express');

var helmet = require('helmet');

var cookieParser = require('cookie-parser');

var cors = require('cors');

var path = require('path');

var pool = require('./src/config/db.js');

var authRoutes = require('./src/routes/authRoutes.js');

var systemRoutes = require('./src/routes/systemRoutes.js');

var app = express(); // ════════════════════════════════════════════════════════
//  1. HELMET — Seguridad HTTP
// ════════════════════════════════════════════════════════

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  frameguard: {
    action: 'deny'
  },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  hidePoweredBy: true,
  dnsPrefetchControl: {
    allow: false
  },
  ieNoOpen: true,
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none'
  },
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },
  crossOriginResourcePolicy: {
    policy: 'same-origin'
  },
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
})); // Permissions-Policy manual

app.use(function (req, res, next) {
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' + 'accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()');
  next();
}); // ════════════════════════════════════════════════════════
//  2. PARSERS Y CORS
// ════════════════════════════════════════════════════════

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,
  credentials: true
})); // ════════════════════════════════════════════════════════
//  3. FRONTEND ESTÁTICO
// ════════════════════════════════════════════════════════

app.use(express["static"](path.join(__dirname, 'frontend'), {
  lastModified: false,
  etag: false
})); // ════════════════════════════════════════════════════════
//  4. RUTAS API
// ════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);
app.use('/api', systemRoutes); // Health check

app.get('/health', function _callee(req, res) {
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(pool.query('SELECT 1'));

        case 3:
          res.json({
            status: 'ok'
          });
          _context.next = 9;
          break;

        case 6:
          _context.prev = 6;
          _context.t0 = _context["catch"](0);
          res.status(500).json({
            status: 'error'
          });

        case 9:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 6]]);
}); // ════════════════════════════════════════════════════════
//  5. FALLBACK SPA
// ════════════════════════════════════════════════════════

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
}); // ════════════════════════════════════════════════════════
//  6. ERROR HANDLER
// ════════════════════════════════════════════════════════

app.use(function (err, req, res, next) {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' ? 'Error interno del servidor' : err.message
  });
}); // ════════════════════════════════════════════════════════
//  7. SERVIDOR
// ════════════════════════════════════════════════════════

var PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("\nServidor corriendo en http://localhost:".concat(PORT));
  console.log("  Frontend  ->  http://localhost:".concat(PORT, "/"));
  console.log("  API       ->  http://localhost:".concat(PORT, "/api"));
  console.log("  Entorno   ->  ".concat(process.env.NODE_ENV || 'development', "\n"));
}); // Export opcional

module.exports = app;