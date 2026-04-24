const pool = require('../config/db');

async function getAllRequests() {
  const result = await pool.query(
    `SELECT r.*, c.full_name AS client_name
     FROM requests r
     LEFT JOIN clients c ON c.id = r.client_id
     ORDER BY r.created_at DESC`
  );
  return result.rows;
}

async function getRequestById(id) {
  const result = await pool.query(
    `SELECT r.*, c.full_name AS client_name
     FROM requests r
     LEFT JOIN clients c ON c.id = r.client_id
     WHERE r.id = $1`,
    [id]
  );
  return result.rows[0];
}

async function createRequest({ client_id, title, description, service_type, status }) {
  const result = await pool.query(
    `INSERT INTO requests (client_id, title, description, service_type, status)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'новая'))
     RETURNING *`,
    [client_id, title, description, service_type, status]
  );
  return result.rows[0];
}

async function updateRequest(id, { title, description, service_type, status }) {
  const result = await pool.query(
    `UPDATE requests
     SET title = $1, description = $2, service_type = $3, status = $4
     WHERE id = $5
     RETURNING *`,
    [title, description, service_type, status, id]
  );
  return result.rows[0];
}

async function deleteRequest(id) {
  const result = await pool.query(
    'DELETE FROM requests WHERE id = $1 RETURNING id',
    [id]
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
