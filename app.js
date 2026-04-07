import express from 'express';
import pool from './src/config/db.js';

const app = express();
app.use(express.json());

// Ruta de prueba
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

//Puerto
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});