import express from 'express';
import pool from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import protectedRoutes from './src/routes/protectedRoutes.js';

const app = express();

// Middleware para leer JSON
app.use(express.json());

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api', protectedRoutes);

/**
 * Ruta de prueba para verificar conexión a la base de datos
 */
app.get('/', async (req, res) => {
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

// Puerto del servidor
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});