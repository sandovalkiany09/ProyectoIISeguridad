import pool from '../config/db.js';

/**
 * Obtener todos los productos
 */
export const getProductos = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos ORDER BY id');

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};


/**
 * Crear un producto
 */
export const createProducto = async (req, res) => {
  try {
    const { codigo, nombre, descripcion, cantidad, precio } = req.body;

    if (!codigo || !nombre || cantidad == null || precio == null) {
      return res.status(400).json({
        message: 'Campos obligatorios faltantes'
      });
    }

    const result = await pool.query(
      `INSERT INTO productos (codigo, nombre, descripcion, cantidad, precio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [codigo, nombre, descripcion, cantidad, precio]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error al crear producto:', error);

    if (error.code === '23505') {
      return res.status(400).json({ message: 'El código ya existe' });
    }

    res.status(500).json({ message: 'Error al crear producto' });
  }
};


/**
 * Actualizar producto
 */
export const patchProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, cantidad, precio } = req.body;

    // Construcción dinámica de la query
    const fields = [];
    const values = [];
    let index = 1;

    if (nombre !== undefined) {
      fields.push(`nombre = $${index++}`);
      values.push(nombre);
    }

    if (descripcion !== undefined) {
      fields.push(`descripcion = $${index++}`);
      values.push(descripcion);
    }

    if (cantidad !== undefined) {
      fields.push(`cantidad = $${index++}`);
      values.push(cantidad);
    }

    if (precio !== undefined) {
      fields.push(`precio = $${index++}`);
      values.push(precio);
    }

    // Validar que al menos un campo venga
    if (fields.length === 0) {
      return res.status(400).json({
        message: 'Debe enviar al menos un campo para actualizar'
      });
    }

    // Agregar ID al final
    values.push(id);

    const query = `
      UPDATE productos
      SET ${fields.join(', ')}
      WHERE id = $${index}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: 'Producto no encontrado'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {
    console.error('Error en PATCH producto:', error);
    res.status(500).json({
      message: 'Error al actualizar producto'
    });
  }
};


/**
 * Eliminar producto
 */
export const deleteProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM productos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado' });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};