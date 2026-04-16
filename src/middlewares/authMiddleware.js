import jwt from 'jsonwebtoken';
import { logAuditoria } from '../utils/auditLogger.js';


/**
 * Verifica si el usuario tiene un token válido
 */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    // Verifica si el token viene en el header
    if (!authHeader) {
      return res.status(401).json({
        message: 'Token requerido'
      });
    }

    // Formato esperado: Bearer token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        message: 'Token inválido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardar datos del usuario en la request
    req.user = decoded;

    next();

  } catch (error) {
    return res.status(403).json({
      message: 'Token inválido o expirado'
    });
  }
};

/**
 * Verifica si el usuario tiene uno de los roles permitidos
 */
export const authorizeRoles = (...rolesPermitidos) => {
  return async (req, res, next) => {
    try {
      if (!rolesPermitidos.includes(req.user.rol_id)) {

        //LOG ACCESO DENEGADO
        await logAuditoria(
          req.user?.id || null,
          `ACCESO DENEGADO a ${req.originalUrl}`,
          req.ip
        );

        return res.status(403).json({
          message: 'Acceso denegado'
        });
      }

      next();

    } catch (error) {
      console.error('Error en autorización:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
};