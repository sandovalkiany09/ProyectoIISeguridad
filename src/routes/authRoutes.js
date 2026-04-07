import express from 'express';
import { register } from '../controllers/authController.js';

const router = express.Router();

/**
 * Ruta para registrar usuarios
 */
router.post('/register', register);

export default router;