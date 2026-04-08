import express from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Ruta protegida: cualquier usuario con token válido
 */
router.get('/perfil', verifyToken, (req, res) => {
  res.json({
    message: 'Acceso permitido',
    user: req.user
  });
});

/**
 * Ruta protegida: solo administrador (rol_id = 1)
 */
router.delete('/admin', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({
    message: 'Acción solo para administradores'
  });
});

export default router;