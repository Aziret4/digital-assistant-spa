const pool = require('../config/db');

async function getAllRequests(userId) {
  const result = await pool.query(
    `SELECT r.*, c.full_name AS client_name
     FROM requests r
     LEFT JOIN clients c ON c.id = r.client_id
     WHERE r.user_id = $1
     ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getRequestById(id, userId) {
  const result = await pool.query(
    `SELECT r.*, c.full_name AS client_name
     FROM requests r
     LEFT JOIN clients c ON c.id = r.client_id
     WHERE r.id = $1 AND r.user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
}

async function createRequest({ user_id, client_id, title, description, service_type, status }) {
  const result = await pool.query(
    `INSERT INTO requests (user_id, client_id, title, description, service_type, status)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'новая'))
     RETURNING *`,
    [user_id, client_id, title, description, service_type, status]
  );
  return result.rows[0];
}

async function updateRequest(id, userId, { title, description, service_type, status }) {
  const result = await pool.query(
    `UPDATE requests
     SET title = $1, description = $2, service_type = $3, status = $4
     WHERE id = $5 AND user_id = $6
     RETURNING *`,
    [title, description, service_type, status, id, userId]
  );
  return result.rows[0];
}

async function deleteRequest(id, userId) {
  const result = await pool.query(
    'DELETE FROM requests WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0];
}

module.exports = {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
};
