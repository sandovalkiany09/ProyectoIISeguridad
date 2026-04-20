import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import jwt from 'jsonwebtoken';
import { logAuditoria } from '../utils/auditLogger.js';
import { registrarIntentoFallido, limpiarIntentos } from '../middlewares/rateLimiter.js';

// ── Opciones de cookie segura ──────────────────────────────────────
// HttpOnly: evita acceso desde JavaScript (protege contra XSS)
// Secure: solo se envía en HTTPS (producción)
// SameSite: protege contra ataques CSRF
// maxAge: duración de la cookie (1 hora, igual que el JWT)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Strict',
  maxAge: 60 * 60 * 1000, // 1 hora
  path: '/',
};

/**
 * POST /api/auth/register
 * Registra un nuevo usuario en el sistema.
 * Incluye validaciones, verificación de duplicados y encriptación de contraseña.
 */
export const register = async (req, res) => {
  try {
    const { username, password, email, rol_id } = req.body;

    // ── Validaciones de entrada ───────────────────────────────────
    if (!username || !password || !email || !rol_id) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ message: 'Username debe tener entre 3 y 50 caracteres' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Formato de email invalido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contrasena debe tener al menos 6 caracteres' });
    }

    // ── Verificar duplicados (usuario o correo) ───────────────────
    const userExists = await pool.query(
      'SELECT id FROM usuarios WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'El usuario o correo ya existe' });
    }

    // ── Encriptación de contraseña (RF-02: cost factor 12) ────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Inserción en base de datos ────────────────────────────────
    const result = await pool.query(
      `INSERT INTO usuarios (username, password, email, rol_id)
       VALUES ($1,$2,$3,$4)
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
 * Autentica al usuario mediante credenciales.
 * Implementa:
 * - Control de intentos fallidos (rate limiting)
 * - Auditoría de eventos
 * - Generación de JWT seguro
 * - Cookie HttpOnly para sesión
 */
export const login = async (req, res) => {

  // Obtener IP del cliente (para auditoría y rate limiting)
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  try {
    const { username, password } = req.body;

    // ── Validación básica ─────────────────────────────────────────
    if (!username || !password) {
      return res.status(400).json({ message: 'Usuario y contrasena son obligatorios' });
    }

    // ── Buscar usuario en BD ──────────────────────────────────────
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1',
      [username]
    );

    // Usuario no existe
    if (result.rows.length === 0) {
      await registrarIntentoFallido(ip, null);
      await logAuditoria(null, `LOGIN fallido - usuario no encontrado (${username})`, ip);

      // Respuesta genérica (evita enumeración de usuarios)
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const user = result.rows[0];

    // ── Comparación de contraseña ─────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await registrarIntentoFallido(ip, user.id);
      await logAuditoria(user.id, 'LOGIN fallido - contrasena incorrecta', ip);

      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    // ── Login exitoso ─────────────────────────────────────────────
    limpiarIntentos(ip); // RS-07: reinicia intentos fallidos

    // Actualizar último acceso
    await pool.query(
      'UPDATE usuarios SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    await logAuditoria(user.id, 'LOGIN exitoso', ip);

    // ── Generación de JWT ─────────────────────────────────────────
    // RS-05: algoritmo explícito (HS256) + expiración 1 hora
    // NO incluir datos sensibles en el payload
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol_id: user.rol_id,
        lastActivity: Date.now() // útil para control de inactividad
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '1h',
        algorithm: 'HS256'
      }
    );

    // ── Envío de cookie segura ────────────────────────────────────
    // RS-04: HttpOnly → el frontend NO puede acceder al token
    res.cookie('sp_token', token, COOKIE_OPTIONS);

    return res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        username: user.username,
        rol_id: user.rol_id
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/auth/logout
 * Cierra la sesión del usuario eliminando la cookie.
 * RS-04: invalida la sesión inmediatamente en el cliente.
 */
export const logout = async (req, res) => {
  try {
    // Registrar evento si el usuario estaba autenticado
    if (req.user) {
      await logAuditoria(req.user.id, 'LOGOUT', req.ip);
    }

    // ── Eliminar cookie de sesión ─────────────────────────────────
    res.clearCookie('sp_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      path: '/'
    });

    return res.json({ message: 'Sesion cerrada correctamente' });

  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/auth/me
 * Devuelve información del usuario autenticado.
 * Se usa para mantener la sesión en el frontend.
 */
export const me = async (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      rol_id: req.user.rol_id
    }
  });
};