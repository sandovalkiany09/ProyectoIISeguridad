import express from 'express';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

/**
 * =========================
 * USUARIOS 
 * =========================
 */

// Leer todos (todos los roles pueden ver)
router.get('/usuarios', verifyToken, authorizeRoles(1, 2, 3), (req, res) => {
  res.json({ message: 'Lista de usuarios' });
});

// Crear (solo admin)
router.post('/usuarios', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Usuario creado' });
});

// Actualizar (solo admin)
router.put('/usuarios/:id', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Usuario actualizado' });
});

// Eliminar (solo admin)
router.delete('/usuarios/:id', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Usuario eliminado' });
});


/**
 * =========================
 * ROLES (CRUD COMPLETO)
 * =========================
 */

// Leer roles
router.get('/roles', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Lista de roles' });
});

// Crear rol
router.post('/roles', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Rol creado' });
});

// Actualizar rol
router.put('/roles/:id', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Rol actualizado' });
});

// Eliminar rol
router.delete('/roles/:id', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Rol eliminado' });
});


/**
 * =========================
 * PRODUCTOS 
 * =========================
 */

router.get('/productos', verifyToken, authorizeRoles(1, 2, 3), (req, res) => {
  res.json({ message: 'Lista de productos' });
});

router.post('/productos', verifyToken, authorizeRoles(1, 3), (req, res) => {
  res.json({ message: 'Producto creado' });
});

router.put('/productos/:id', verifyToken, authorizeRoles(1, 3), (req, res) => {
  res.json({ message: 'Producto actualizado' });
});

router.delete('/productos/:id', verifyToken, authorizeRoles(1), (req, res) => {
  res.json({ message: 'Producto eliminado' });
});


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