import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import pool from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import systemRoutes from './src/routes/systemRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ════════════════════════════════════════════════════════
//  1. HELMET — Seguridad HTTP
// ════════════════════════════════════════════════════════
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        scriptSrcAttr: ["'none'"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'",
        "http://localhost:3000",
        "http://localhost:8080",
        "https://cheek-stretch-scuff.ngrok-free.dev"],
        frameSrc: ["'none'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },

    frameguard: { action: 'deny' },

    hsts: process.env.NODE_ENV === 'production'
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,

    noSniff: true,
    hidePoweredBy: true,
    dnsPrefetchControl: { allow: false },
    ieNoOpen: true,

    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);

// Permissions-Policy manual
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
    'accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=()'
  );
  next();
});

// ════════════════════════════════════════════════════════
//  2. PARSERS Y CORS
// ════════════════════════════════════════════════════════
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true,
}));

// ════════════════════════════════════════════════════════
//  3. FRONTEND ESTÁTICO
// ════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'frontend'), {
  lastModified: false,
  etag: false,
}));

// ════════════════════════════════════════════════════════
//  4. RUTAS API
// ════════════════════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api', systemRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error' });
  }
});

// ════════════════════════════════════════════════════════
//  5. FALLBACK SPA
// ════════════════════════════════════════════════════════
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ════════════════════════════════════════════════════════
//  6. ERROR HANDLER
// ════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message
  });
});

// ════════════════════════════════════════════════════════
//  7. SERVIDOR
// ════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\nServidor corriendo en http://localhost:${PORT}`);
  console.log(`  Frontend  ->  http://localhost:${PORT}/`);
  console.log(`  API       ->  http://localhost:${PORT}/api`);
  console.log(`  Entorno   ->  ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;