import express from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * =========================
 * USUARIOS 
 * =========================
 */
import {
  getUsuarios,
  createUsuario,
  patchUsuario,
  deleteUsuario
} from '../controllers/userController.js';

// Ver usuarios (todos)
router.get('/usuarios', verifyToken, authorizeRoles(1, 2, 3), getUsuarios);

// Crear usuario (solo admin)
router.post('/usuarios', verifyToken, authorizeRoles(1), createUsuario);

// Actualizar usuario (solo admin)
router.patch('/usuarios/:id', verifyToken, authorizeRoles(1), patchUsuario);

// Eliminar usuario (solo admin)
router.delete('/usuarios/:id', verifyToken, authorizeRoles(1), deleteUsuario);


/**
 * =========================
 * ROLES 
 * =========================
 */

import {
  getRoles,
  createRole,
  patchRole,
  deleteRole
} from '../controllers/roleController.js';

// Ver roles (solo admin)
router.get('/roles', verifyToken, authorizeRoles(1), getRoles);

// Crear rol (solo admin)
router.post('/roles', verifyToken, authorizeRoles(1), createRole);

// Actualizar rol (solo admin)
router.patch('/roles/:id', verifyToken, authorizeRoles(1), patchRole);

// Eliminar rol (solo admin)
router.delete('/roles/:id', verifyToken, authorizeRoles(1), deleteRole);


/**
 * =========================
 * PRODUCTOS 
 * =========================
 */

import {
  getProductos,
  createProducto,
  patchProducto,
  deleteProducto
} from '../controllers/productController.js';

// Ver productos (todos)
router.get('/productos', verifyToken, authorizeRoles(1, 2, 3), getProductos);

// Crear producto (admin y registrador)
router.post('/productos', verifyToken, authorizeRoles(1, 3), createProducto);

// Actualizar producto (admin y registrador)
router.patch('/productos/:id', verifyToken, authorizeRoles(1, 3), patchProducto);

// Eliminar producto (solo admin)
router.delete('/productos/:id', verifyToken, authorizeRoles(1), deleteProducto);


/**
 * =========================
 * LOGS Y REPORTES
 * =========================
 */

router.get('/logs', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Logs de auditoría' });
});

router.get('/reportes', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Reportes del sistema' });
});

export default router;