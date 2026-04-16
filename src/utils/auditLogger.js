import pool from '../config/db.js';

export const logAuditoria = async (usuario_id, accion, ip) => {
  try {
    await pool.query(
      `INSERT INTO logs_auditoria (usuario_id, accion, ip)
       VALUES ($1, $2, $3)`,
      [usuario_id, accion, ip]
    );
  } catch (error) {
    console.error('Error en auditoría:', error);
  }
};