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

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    const actualizado = result.rows[0];

    // LOG (detecta cambio de rol)
    if (rol_id !== undefined) {
      await logAuditoria(
        req.user.id,
        `CAMBIO ROL usuario ID ${actualizado.id} a rol ${rol_id}`,
        req.ip
      );
    } else {
      //LOG
      await logAuditoria(
        req.user.id,
        `UPDATE usuario ID ${actualizado.id}`,
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