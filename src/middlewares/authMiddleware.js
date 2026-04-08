import jwt from 'jsonwebtoken';

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
  return (req, res, next) => {
    try {
      const userRole = req.user.rol_id;

      if (!rolesPermitidos.includes(userRole)) {
        return res.status(403).json({
          message: 'No tienes permisos para esta acción'
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        message: 'Error en autorización'
      });
    }
  };
};