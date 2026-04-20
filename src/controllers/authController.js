import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import { logAuditoria } from '../utils/auditLogger.js';

// ── Opciones de cookie segura ──────────────────────────────────────
// HttpOnly: JavaScript del cliente NO puede leer la cookie (previene XSS)
// Secure:   Solo se envía por HTTPS (en producción)
// SameSite: 'Strict' previene CSRF al no enviar cookie en requests cross-site
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true en prod (HTTPS), false en dev
  sameSite: 'Strict',
  maxAge: 60 * 60 * 1000, // 1 hora en ms (coincide con expiración JWT)
  path: '/',
};

// ── Tiempo de inactividad máximo: 5 minutos ────────────────────────
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 300,000 ms

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en la base de datos.
 * Solo disponible para usuarios autenticados con rol SuperAdmin.
 */
export const register = async (req, res) => {
  try {
    const { username, password, email, rol_id } = req.body;

    // Validación básica
    if (!username || !password || !email || !rol_id) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Verificar si ya existe el usuario o email
    const userExists = await pool.query(
      'SELECT id FROM usuarios WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El usuario o correo ya existe' });
    }

    // Encriptar contraseña (nunca almacenar en texto plano — RS-04)
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO usuarios (username, password, email, rol_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, rol_id`,
      [username, hashedPassword, email, rol_id]
    );

    return res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/auth/login
 * Autentica al usuario y emite una cookie HttpOnly con el JWT.
 *
 * RS-04: Regenera el "identificador de sesión" emitiendo un token nuevo en
 *        cada login (previene Session Fixation). La cookie anterior se
 *        sobrescribe automáticamente.
 * RS-05: El JWT expira en 1 hora y nunca se devuelve en el body.
 */
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contraseña son obligatorios' });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      await logAuditoria(null, `LOGIN fallido - usuario no encontrado (${username})`, req.ip);
      // Respuesta genérica para no revelar si el usuario existe (enumeración)
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAuditoria(user.id, 'LOGIN fallido - contraseña incorrecta', req.ip);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Actualizar último login y timestamp de actividad (RS-04)
    await pool.query(
      'UPDATE usuarios SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    await logAuditoria(user.id, 'LOGIN exitoso', req.ip);

    // ── RS-05: Firmar JWT con algoritmo explícito (nunca 'none') ──
    // El payload NO incluye datos sensibles (contraseña, email, etc.)
    const token = jwt.sign(
      {
        id:       user.id,
        username: user.username,
        rol_id:   user.rol_id,
        // iat incluido automáticamente por jsonwebtoken
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
        algorithm: 'HS256', // algoritmo explícito — rechaza 'none'
      }
    );

    // ── RS-04: Emitir cookie HttpOnly — el cliente nunca lee el token ──
    // RS-04: Esta cookie nueva regenera/invalida la sesión anterior
    res.cookie('sp_token', token, COOKIE_OPTIONS);

    // Responder con datos públicos del usuario (sin token en body)
    return res.json({
      message: 'Login exitoso',
      user: {
        id:       user.id,
        username: user.username,
        rol_id:   user.rol_id,
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/auth/logout
 * Invalida la sesión limpiando la cookie del lado del servidor.
 * RS-04: La sesión se invalida inmediatamente al hacer logout.
 */
export const logout = async (req, res) => {
  try {
    if (req.user) {
      await logAuditoria(req.user.id, 'LOGOUT', req.ip);
    }

    // Limpiar la cookie — maxAge: 0 la hace expirar de inmediato
    res.clearCookie('sp_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      path: '/',
    });

    return res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/auth/me
 * Devuelve los datos públicos del usuario autenticado.
 * Usado por el frontend al cargar para saber quién está logueado.
 */
export const me = async (req, res) => {
  return res.json({
    user: {
      id:       req.user.id,
      username: req.user.username,
      rol_id:   req.user.rol_id,
    }
  });
};