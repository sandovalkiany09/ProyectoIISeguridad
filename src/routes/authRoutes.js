import express from 'express';
import { register, login, logout, me } from '../controllers/authController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { loginRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// ── Rutas públicas ───────────────────────────────────────────────
// Solo login está disponible sin autenticación
// RS-07: loginRateLimiter se ejecuta ANTES del controlador login
router.post('/login', loginRateLimiter, login);

// ── Rutas protegidas ─────────────────────────────────────────────
// Requieren token válido (usuario autenticado)

// Registro ahora es protegido solo superadmin debería crear usuarios
router.post('/register', verifyToken, register);

// Cerrar sesión
router.post('/logout', verifyToken, logout);

// Obtener datos del usuario autenticado
router.get('/me', verifyToken, me);

export default router;