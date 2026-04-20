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

// ════════════════════════════════════════════════════════
//  MIDDLEWARES
// ════════════════════════════════════════════════════════

app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: true,
  credentials: true,
}));

// Cabeceras de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ════════════════════════════════════════════════════════
//  FRONTEND ESTÁTICO
//  Express sirve la carpeta frontend/ en el mismo puerto
// ════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'frontend')));

// ════════════════════════════════════════════════════════
//  RUTAS DE LA API
// ════════════════════════════════════════════════════════
app.use('/api/auth', authRoutes);
app.use('/api',      systemRoutes);

// Verificación de BD
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Fallback: Express 5 requiere '/{*path}' en lugar de '*'
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ════════════════════════════════════════════════════════
//  INICIO
// ════════════════════════════════════════════════════════
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\nServidor corriendo en http://localhost:${PORT}`);
  console.log(`  Frontend  ->  http://localhost:${PORT}/`);
  console.log(`  API       ->  http://localhost:${PORT}/api`);
  console.log(`  Entorno   ->  ${process.env.NODE_ENV || 'development'}\n`);
});

export default app;