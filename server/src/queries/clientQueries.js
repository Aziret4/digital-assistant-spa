const pool = require('../config/db');

async function getAllClients() {
  const result = await pool.query(
    'SELECT * FROM clients ORDER BY created_at DESC'
  );
  return result.rows;
}

async function getClientById(id) {
  const result = await pool.query(
    'SELECT * FROM clients WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function createClient({ full_name, phone, email, source, notes }) {
  const result = await pool.query(
    `INSERT INTO clients (full_name, phone, email, source, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [full_name, phone, email, source, notes]
  );
  return result.rows[0];
}

async function updateClient(id, { full_name, phone, email, source, notes }) {
  const result = await pool.query(
    `UPDATE clients
     SET full_name = $1, phone = $2, email = $3, source = $4, notes = $5
     WHERE id = $6
     RETURNING *`,
    [full_name, phone, email, source, notes, id]
  );
  return result.rows[0];
}

async function deleteClient(id) {
  const result = await pool.query(
    'DELETE FROM clients WHERE id = $1 RETURNING id',
    [id]
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
