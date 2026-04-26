const pool = require('../config/db');

async function getAllClients(userId) {
  const result = await pool.query(
    'SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

async function getClientById(id, userId) {
  const result = await pool.query(
    'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0];
}

async function createClient({ user_id, full_name, phone, email, source, notes }) {
  const result = await pool.query(
    `INSERT INTO clients (user_id, full_name, phone, email, source, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [user_id, full_name, phone, email, source, notes]
  );
  return result.rows[0];
}

async function updateClient(id, userId, { full_name, phone, email, source, notes }) {
  const result = await pool.query(
    `UPDATE clients
     SET full_name = $1, phone = $2, email = $3, source = $4, notes = $5
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [full_name, phone, email, source, notes, id, userId]
  );
  return result.rows[0];
}

async function deleteClient(id, userId) {
  const result = await pool.query(
    'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0];
}

module.exports = {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
};
