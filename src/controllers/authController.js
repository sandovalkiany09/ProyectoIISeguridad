import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import { logAuditoria } from '../utils/auditLogger.js';

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

/**
 * Login de usuario
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validación básica
    if (!username || !password) {
      return res.status(400).json({
        message: 'Usuario y contraseña son obligatorios'
      });
    }

    // Buscar usuario en la base de datos
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1',
      [username]
    );

    // Usuario no existe
    if (result.rows.length === 0) {

      await logAuditoria(
        null,
        `LOGIN fallido - usuario no encontrado (${username})`,
        req.ip
      );

      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];

    // Comparar contraseña con bcrypt
    const isMatch = await bcrypt.compare(password, user.password);

    // Contraseña incorrecta
    if (!isMatch) {

      await logAuditoria(
        user.id,
        'LOGIN fallido - contraseña incorrecta',
        req.ip
      );

      return res.status(401).json({
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último login
    await pool.query(
      'UPDATE usuarios SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    // Log exitoso
    await logAuditoria(
      user.id,
      'LOGIN exitoso',
      req.ip
    );

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol_id: user.rol_id
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Respuesta exitosa
    return res.json({
      message: 'Login exitoso',
      token
    });

  } catch (error) {
    console.error('Error en login:', error);

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};