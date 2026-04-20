import jwt from 'jsonwebtoken';
import { logAuditoria } from '../utils/auditLogger.js';

// ── Tiempo de inactividad máximo (RS-04) ──────────────────────────
const INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutos

// ── Algoritmos JWT permitidos (RS-05) ─────────────────────────────
// Rechazo explícito de 'none' y algoritmos simétricos débiles.
const ALLOWED_ALGORITHMS = ['HS256'];

/**
 * verifyToken
 *
 * Lee el JWT desde la cookie HttpOnly 'sp_token' (nunca del header
 * Authorization para requests de navegador — RS-04 / RS-05).
 *
 * Controles aplicados:
 *  - Cookie ausente → 401
 *  - Algoritmo no permitido (incluye 'none') → 403
 *  - Token expirado o firma inválida → 403
 *  - Inactividad > 5 minutos → 401 + limpiar cookie (RS-04)
 *  - Token válido → actualiza timestamp de actividad en la cookie
 */
export const verifyToken = (req, res, next) => {
  try {
    // 1. Leer token desde cookie HttpOnly (no del header)
    const token = req.cookies?.sp_token;

    if (!token) {
      return res.status(401).json({ message: 'Sesión no iniciada' });
    }

    // 2. Verificar token con algoritmos permitidos explícitamente
    //    El flag algorithms previene el ataque de algoritmo 'none'
    //    donde un atacante envía un token sin firma.
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ALLOWED_ALGORITHMS, // RS-05: rechaza 'none' y otros
      });
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        _clearSession(res);
        return res.status(401).json({ message: 'Sesión expirada, inicia sesión nuevamente' });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(403).json({ message: 'Token inválido o manipulado' });
      }
      return res.status(403).json({ message: 'Error al verificar sesión' });
    }

    // 3. RS-04: Control de inactividad (5 minutos)
    //    Usamos el campo 'iat' del token más un campo propio 'lastActivity'
    //    que se actualiza en cada request válido.
    const now = Date.now();
    const lastActivity = decoded.lastActivity || (decoded.iat * 1000);
    const elapsed = now - lastActivity;

    if (elapsed > INACTIVITY_LIMIT_MS) {
      _clearSession(res);
      return res.status(401).json({
        message: 'Sesión expirada por inactividad (5 minutos). Inicia sesión nuevamente.',
        reason: 'INACTIVITY_TIMEOUT'
      });
    }

    // 4. Adjuntar datos del usuario al request
    req.user = decoded;

    // 5. RS-04: Renovar el timestamp de actividad en cada request
    //    Emitimos una cookie actualizada con lastActivity fresco.
    //    Esto mantiene viva la sesión mientras el usuario esté activo,
    //    pero la expira exactamente 5 min después del último request.
    const refreshed = jwt.sign(
      {
        id:           decoded.id,
        username:     decoded.username,
        rol_id:       decoded.rol_id,
        lastActivity: now,
      },
      process.env.JWT_SECRET,
      {
        expiresIn:  '1h',
        algorithm:  'HS256',
      }
    );

    res.cookie('sp_token', refreshed, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge:   60 * 60 * 1000, // 1 hora
      path:     '/',
    });

    next();

  } catch (error) {
    console.error('Error inesperado en verifyToken:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * authorizeRoles
 * Verifica que el rol del usuario esté en la lista de roles permitidos.
 * Registra en auditoría cada intento de acceso denegado.
 */
export const authorizeRoles = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      if (!rolesPermitidos.includes(req.user.rol_id)) {
        await logAuditoria(
          req.user?.id || null,
          `ACCESO DENEGADO a ${req.originalUrl}`,
          req.ip
        );
        return res.status(403).json({ message: 'Acceso denegado' });
      }
      next();
    } catch (error) {
      console.error('Error en authorizeRoles:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};

/** Limpia la cookie de sesión */
function _clearSession(res) {
  res.clearCookie('sp_token', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    path:     '/',
  });
}