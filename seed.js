// seed.js
import pkg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pkg;

async function createDatabase() {
  // Conectar a 'postgres' (siempre existe) para crear la BD
  const adminPool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // 👈 BD por defecto
    port: 5432,
  });

  const client = await adminPool.connect();
  try {
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = 'proyecto_seguridad'`
    );
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE proyecto_seguridad`);
      console.log('✅ Base de datos creada');
    } else {
      console.log('ℹ️ La base de datos ya existe');
    }
  } finally {
    client.release();
    await adminPool.end();
  }
}

async function seed() {
  await createDatabase(); // 👈 Crear BD antes de conectarse a ella

  const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432,
  });

  const client = await pool.connect();
  try {
    console.log('🌱 Ejecutando seed...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    await client.query(`
      INSERT INTO usuarios (username, password, email, rol_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (username) DO NOTHING
    `, ['superadmin', hashedPassword, 'superadmin@sistema.com', 1]);
    console.log('✅ Usuario superadmin creado correctamente');
  } catch (err) {
    console.error('❌ Error en seed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();