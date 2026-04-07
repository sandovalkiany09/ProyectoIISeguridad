import bcrypt from 'bcrypt';
import pool from '../config/db.js';

/**
 * Registra un nuevo usuario en la base de datos
 */
export const register = async (req, res) => {
  try {
    const { username, password, email, rol_id } = req.body;

    // Validación básica de datos obligatorios
    if (!username || !password || !email || !rol_id) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios'
      });
    }

    // Verificar si el usuario ya existe
    const userExists = await pool.query(
      'SELECT id FROM usuarios WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({
        message: 'El usuario o correo ya existe'
      });
    }

    // Encriptar la contraseña usando bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insertar usuario usando query parametrizada 
    const result = await pool.query(
      `INSERT INTO usuarios (username, password, email, rol_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, rol_id`,
      [username, hashedPassword, email, rol_id]
    );

    // Respuesta exitosa
    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error en register:', error);

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};