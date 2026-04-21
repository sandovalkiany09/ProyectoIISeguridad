import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import systemRoutes from './src/routes/systemRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();

app.disable('x-powered-by');
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));

// RS-06: Cabeceras de seguridad HTTP

 app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  res.setHeader('Content-Security-Policy', `
    default-src 'self';
    script-src 'self';
    style-src 'self' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data:;
    connect-src 'self';
    frame-ancestors 'none';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
  `.replace(/\s+/g, ' ').trim());

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
});

// Servir frontend estatico desde la carpeta frontend/
app.use(express.static(path.join(__dirname, 'frontend')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api',      systemRoutes);

// Verificacion de BD
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\nServidor corriendo en http://localhost:${PORT}`);
  console.log(`  Frontend  ->  http://localhost:${PORT}/`);
  console.log(`  API       ->  http://localhost:${PORT}/api`);
  console.log(`  Entorno   ->  ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;