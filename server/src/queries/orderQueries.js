const pool = require('../config/db');

async function getAllOrders(userId) {
  const result = await pool.query(
    `SELECT o.*, c.full_name AS client_name
     FROM orders o
     LEFT JOIN clients c ON c.id = o.client_id
     WHERE o.user_id = $1
     ORDER BY o.created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function getOrderById(id, userId) {
  const result = await pool.query(
    `SELECT o.*, c.full_name AS client_name
     FROM orders o
     LEFT JOIN clients c ON c.id = o.client_id
     WHERE o.id = $1 AND o.user_id = $2`,
    [id, userId]
  );
  return result.rows[0];
}

async function createOrder({ user_id, client_id, request_id, service_name, amount, deadline, status, comment }) {
  const result = await pool.query(
    `INSERT INTO orders (user_id, client_id, request_id, service_name, amount, deadline, status, comment)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'принят'), $8)
     RETURNING *`,
    [user_id, client_id, request_id || null, service_name, amount || 0, deadline || null, status, comment || null]
  );
  return result.rows[0];
}

async function updateOrder(id, userId, { service_name, amount, deadline, status, comment }) {
  const result = await pool.query(
    `UPDATE orders
     SET service_name = $1, amount = $2, deadline = $3, status = $4, comment = $5
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [service_name, amount, deadline, status, comment, id, userId]
  );
  return result.rows[0];
}

async function deleteOrder(id, userId) {
  const result = await pool.query(
    'DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId]
  );
  return result.rows[0];
}

async function convertRequestToOrder(requestId, userId, { service_name, amount, deadline, comment }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      'SELECT * FROM requests WHERE id = $1 AND user_id = $2',
      [requestId, userId]
    );
    const request = requestResult.rows[0];

    if (!request) {
      await client.query('ROLLBACK');
      return { error: 'Заявка не найдена' };
    }

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, client_id, request_id, service_name, amount, deadline, comment, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'принят')
       RETURNING *`,
      [
        userId,
        request.client_id,
        request.id,
        service_name || request.service_type || request.title,
        amount || 0,
        deadline || null,
        comment || null,
      ]
    );

    await client.query(
      `UPDATE requests SET status = 'переведена в заказ' WHERE id = $1 AND user_id = $2`,
      [requestId, userId]
    );

    await client.query('COMMIT');
    return { order: orderResult.rows[0] };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  convertRequestToOrder,
};
