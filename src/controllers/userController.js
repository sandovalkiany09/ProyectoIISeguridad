import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { logAuditoria } from '../utils/auditLogger.js';

/**
 * Obtener todos los usuarios
 */
export const getUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.username AS nombre,
        u.email,
        u.rol_id,
        r.nombre AS rol,
        u.last_login,
        u.created_at
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      ORDER BY u.id
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};


/**
 * Crear usuario (solo admin)
 */
export const createUsuario = async (req, res) => {
  try {
    const { nombre, email, password, rol_id } = req.body;

    if (!nombre || !email || !password || !rol_id) {
      return res.status(400).json({
        message: 'Todos los campos son obligatorios'
      });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO usuarios (username, email, password, rol_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username AS nombre, email, rol_id`,
      [nombre, email, hashedPassword, rol_id]
    );

    // LOG
    const nuevo = result.rows[0];
    await logAuditoria(
      req.user.id,
      `CREATE usuario ID ${nuevo.id}`,
      req.ip
    );

    res.status(201).json(nuevo);

  } catch (error) {
    console.error('Error al crear usuario:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        message: 'El email ya está registrado'
      });
    }

    res.status(500).json({ message: 'Error al crear usuario' });
  }
};


/**
 * Actualizar usuario (PATCH)
 */
export const patchUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, password, rol_id } = req.body;

    // ── 1. Obtener datos actuales del usuario ─────────────────────
    const currentUser = await pool.query(
      'SELECT username, email, rol_id FROM usuarios WHERE id = $1',
      [id]
    );

    if (currentUser.rows.length === 0) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    const oldData = currentUser.rows[0];

    // ── 2. Preparar actualización dinámica ───────────────────────
    const fields = [];
    const values = [];
    let index = 1;

    if (nombre !== undefined) {
      fields.push(`username = $${index++}`);
      values.push(nombre);
    }

    if (email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(email);
    }

    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push(`password = $${index++}`);
      values.push(hashedPassword);
    }

    if (rol_id !== undefined) {
      fields.push(`rol_id = $${index++}`);
      values.push(rol_id);
    }

    if (fields.length === 0) {
      return res.status(400).json({
        message: 'Debe enviar al menos un campo'
      });
    }

    values.push(id);

    const query = `
      UPDATE usuarios
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING id, username AS nombre, email, rol_id
    `;

    const result = await pool.query(query, values);
    const actualizado = result.rows[0];

    // ── 3. Detectar cambios reales ───────────────────────────────
    let cambios = [];

    if (nombre !== undefined && nombre !== oldData.username) {
      cambios.push(`username`);
    }

    if (email !== undefined && email !== oldData.email) {
      cambios.push(`email`);
    }

    if (password !== undefined) {
      cambios.push(`password: [ACTUALIZADA]`);
    }

    if (rol_id !== undefined && rol_id !== oldData.rol_id) {
      cambios.push(`rol_id: ${oldData.rol_id} → ${rol_id}`);
    }

    // ── 4. Registrar auditoría ───────────────────────────────────
    if (cambios.length > 0) {
      await logAuditoria(
        req.user.id,
        `UPDATE usuario ID ${actualizado.id} | Cambios: ${cambios.join(', ')}`,
        req.ip
      );
    } else {
      await logAuditoria(
        req.user.id,
        `UPDATE usuario ID ${actualizado.id} | Sin cambios reales`,
        req.ip
      );
    }

    res.json(actualizado);

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
};

/**
 * Eliminar usuario
 */
export const deleteUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // LOG
    await logAuditoria(
      req.user.id,
      `DELETE usuario ID ${id}`,
      req.ip
    );

    res.json({ message: 'Usuario eliminado' });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario' });
  }
};