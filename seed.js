import bcrypt from 'bcrypt';
import pool from './src/config/db.js';

const hash = await bcrypt.hash('123456', 12);

await pool.query(
  `INSERT INTO usuarios (username, password, email, rol_id)
   VALUES ($1, $2, $3, $4)`,
  ['admin', hash, 'admin@test.com', 1]
);

console.log('Usuario admin creado');
process.exit();