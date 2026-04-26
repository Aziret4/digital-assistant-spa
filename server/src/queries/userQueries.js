const pool = require('../config/db');

async function findUserByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

async function findUserById(id) {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function findUserByIdWithPassword(id) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function createUser({ name, email, password, role }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, password, role || 'owner']
  );
  return result.rows[0];
}

async function updateUserProfile(id, { name, email }) {
  const result = await pool.query(
    `UPDATE users
     SET name = $1, email = $2
     WHERE id = $3
     RETURNING id, name, email, role, created_at`,
    [name, email, id]
  );
  return result.rows[0];
}

async function updateUserPassword(id, hashedPassword) {
  const result = await pool.query(
    'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
    [hashedPassword, id]
  );
  return result.rows[0];
}

async function deleteUser(id) {
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0];
}

module.exports = {
  findUserByEmail,
  findUserById,
  findUserByIdWithPassword,
  createUser,
  updateUserProfile,
  updateUserPassword,
  deleteUser,
};
