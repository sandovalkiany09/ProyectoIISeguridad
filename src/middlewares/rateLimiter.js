import { logAuditoria } from '../utils/auditLogger.js';

/**
 * RS-07 | Rate Limiting en el Login
 *
 * Bloquea temporalmente (5 minutos) una IP tras 5 intentos fallidos consecutivos.
 * Se implementa en memoria (Map) para no requerir Redis en desarrollo.
 * En producción se recomienda usar express-rate-limit + Redis.
 *
 * Estructura del mapa:
 *   key: IP  →  { count: número de intentos, blockedUntil: timestamp | null }
 */

const loginAttempts = new Map();

const MAX_INTENTOS   = 5;           // intentos fallidos antes de bloquear
const BLOQUEO_MS     = 5 * 60 * 1000; // 5 minutos en ms
const VENTANA_MS     = 15 * 60 * 1000; // ventana de conteo: 15 minutos

/**
 * Middleware que se aplica ANTES del controlador de login.
 * Si la IP está bloqueada, rechaza la petición con 429 Too Many Requests.
 */
export const loginRateLimiter = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  // Si hay un bloqueo activo
  if (record?.blockedUntil && now < record.blockedUntil) {
    const minutosRestantes = Math.ceil((record.blockedUntil - now) / 60000);

    // Registrar intento durante bloqueo en auditoría
    await logAuditoria(
      null,
      `LOGIN bloqueado por rate limiting (IP: ${ip}) - ${minutosRestantes} min restantes`,
      ip
    );

    return res.status(429).json({
      message: `Demasiados intentos fallidos. IP bloqueada por ${minutosRestantes} minuto(s).`,
      blockedUntil: new Date(record.blockedUntil).toISOString(),
      reason: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Si el bloqueo ya expiró, limpiar
  if (record?.blockedUntil && now >= record.blockedUntil) {
    loginAttempts.delete(ip);
  }

  next();
};

/**
 * Registra un intento de login fallido para una IP.
 * Llamar desde el controlador de login cuando las credenciales son incorrectas.
 */
export const registrarIntentoFallido = async (ip, userId = null) => {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now, blockedUntil: null };

  // Si la ventana de conteo expiró, reiniciar
  if (now - record.firstAttempt > VENTANA_MS) {
    record.count = 0;
    record.firstAttempt = now;
    record.blockedUntil = null;
  }

  record.count++;

  if (record.count >= MAX_INTENTOS) {
    record.blockedUntil = now + BLOQUEO_MS;

    // Registrar bloqueo en auditoría (RS-07 requiere registrar el bloqueo)
    await logAuditoria(
      userId,
      `CUENTA BLOQUEADA por rate limiting - ${MAX_INTENTOS} intentos fallidos desde IP ${ip}`,
      ip
    );

    console.warn(`[RATE LIMIT] IP ${ip} bloqueada hasta ${new Date(record.blockedUntil).toLocaleString()}`);
  }

  loginAttempts.set(ip, record);
};

/**
 * Limpia los intentos fallidos de una IP al hacer login exitoso.
 * Evita que un login exitoso mantenga contadores de intentos previos.
 */
export const limpiarIntentos = (ip) => {
  loginAttempts.delete(ip);
};

/**
 * Utilidad: devuelve el estado actual de una IP (para debugging/admin).
 */
export const estadoIP = (ip) => {
  return loginAttempts.get(ip) || null;
};