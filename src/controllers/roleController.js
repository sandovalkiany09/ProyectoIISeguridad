import pool from '../config/db.js';

/**
 * Obtener todos los roles
 */
export const getRoles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ message: 'Error al obtener roles' });
  }
};


/**
 * Crear rol
 */
export const createRole = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        message: 'El nombre del rol es obligatorio'
      });
    }

    const result = await pool.query(
      'INSERT INTO roles (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error al crear rol:', error);

    if (error.code === '23505') {
      return res.status(400).json({
        message: 'El rol ya existe'
      });
    }

    res.status(500).json({ message: 'Error al crear rol' });
  }
};


/**
 * Actualizar rol (PATCH)
 */
export const patchRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;

    if (!nombre) {
      return res.status(400).json({
        message: 'Debe enviar el nombre del rol'
      });
    }

    const result = await pool.query(
      'UPDATE roles SET nombre = $1 WHERE id = $2 RETURNING *',
      [nombre, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Rol no encontrado'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error al actualizar rol:', error);
    res.status(500).json({ message: 'Error al actualizar rol' });
  }
};


/**
 * Eliminar rol
 */
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM roles WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Rol no encontrado'
      });
    }

    res.json({ message: 'Rol eliminado' });

  } catch (error) {
    console.error('Error al eliminar rol:', error);

    // Error por FK (usuarios usando ese rol)
    if (error.code === '23503') {
      return res.status(400).json({
        message: 'No se puede eliminar el rol porque está en uso'
      });
    }

    res.status(500).json({ message: 'Error al eliminar rol' });
  }
};