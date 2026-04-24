const pool = require('../config/db');

async function getAllOrders() {
  const result = await pool.query(
    `SELECT o.*, c.full_name AS client_name
     FROM orders o
     LEFT JOIN clients c ON c.id = o.client_id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
}

async function getOrderById(id) {
  const result = await pool.query(
    `SELECT o.*, c.full_name AS client_name
     FROM orders o
     LEFT JOIN clients c ON c.id = o.client_id
     WHERE o.id = $1`,
    [id]
  );
  return result.rows[0];
}

async function createOrder({ client_id, request_id, service_name, amount, deadline, status, comment }) {
  const result = await pool.query(
    `INSERT INTO orders (client_id, request_id, service_name, amount, deadline, status, comment)
     VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'принят'), $7)
     RETURNING *`,
    [client_id, request_id || null, service_name, amount || 0, deadline || null, status, comment || null]
  );
  return result.rows[0];
}

async function updateOrder(id, { service_name, amount, deadline, status, comment }) {
  const result = await pool.query(
    `UPDATE orders
     SET service_name = $1, amount = $2, deadline = $3, status = $4, comment = $5
     WHERE id = $6
     RETURNING *`,
    [service_name, amount, deadline, status, comment, id]
  );
  return result.rows[0];
}

async function deleteOrder(id) {
  const result = await pool.query(
    'DELETE FROM orders WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0];
}

async function convertRequestToOrder(requestId, { service_name, amount, deadline, comment }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const requestResult = await client.query(
      'SELECT * FROM requests WHERE id = $1',
      [requestId]
    );
    const request = requestResult.rows[0];

    if (!request) {
      await client.query('ROLLBACK');
      return { error: 'Заявка не найдена' };
    }

    const orderResult = await client.query(
      `INSERT INTO orders (client_id, request_id, service_name, amount, deadline, comment, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'принят')
       RETURNING *`,
      [
        request.client_id,
        request.id,
        service_name || request.service_type || request.title,
        amount || 0,
        deadline || null,
        comment || null,
      ]
    );

    await client.query(
      `UPDATE requests SET status = 'переведена в заказ' WHERE id = $1`,
      [requestId]
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
