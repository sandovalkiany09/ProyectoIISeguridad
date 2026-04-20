import express from 'express';
import { register, login, logout, me } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * Rutas públicas — no requieren autenticación
 */
router.post('/login',    login);
router.post('/register', register);

/**
 * Rutas protegidas — requieren cookie de sesión válida
 */
// RS-04: Logout limpia la cookie del lado del servidor
router.post('/logout', verifyToken, logout);

// Devuelve los datos del usuario autenticado actual (usado por el frontend al cargar)
router.get('/me', verifyToken, me);

export default router;