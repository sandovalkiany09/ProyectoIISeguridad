import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import pool from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import systemRoutes from './src/routes/systemRoutes.js';

const app = express();

//Fix __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'frontend')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api', systemRoutes);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Ruta de prueba BD
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Conexión exitosa a la base de datos',
      fecha: result.rows[0].now
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error al conectar con la base de datos'
    });
  }
});

// Puerto
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});