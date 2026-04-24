const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
} = require('../queries/orderQueries');

const ALLOWED_STATUSES = ['принят', 'в работе', 'готов', 'выдан', 'отменен'];

async function listOrders(req, res) {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (err) {
    console.error('listOrders error:', err);
    res.status(500).json({ message: 'Ошибка при получении списка заказов' });
  }
}

async function getOrder(req, res) {
  try {
    const order = await getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    res.json(order);
  } catch (err) {
    console.error('getOrder error:', err);
    res.status(500).json({ message: 'Ошибка при получении заказа' });
  }
}

async function addOrder(req, res) {
  try {
    const { client_id, request_id, service_name, amount, deadline, status, comment } = req.body;

    if (!client_id || !service_name) {
      return res.status(400).json({ message: 'Поля client_id и service_name обязательны' });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус заказа' });
    }

    const order = await createOrder({
      client_id,
      request_id,
      service_name,
      amount,
      deadline,
      status,
      comment,
    });
    res.status(201).json(order);
  } catch (err) {
    console.error('addOrder error:', err);
    res.status(500).json({ message: 'Ошибка при создании заказа' });
  }
}

async function editOrder(req, res) {
  try {
    const { service_name, amount, deadline, status, comment } = req.body;

    if (!service_name) {
      return res.status(400).json({ message: 'Поле service_name обязательно' });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус заказа' });
    }

    const existing = await getOrderById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const order = await updateOrder(req.params.id, {
      service_name,
      amount: amount ?? existing.amount,
      deadline: deadline ?? existing.deadline,
      status: status || existing.status,
      comment: comment ?? existing.comment,
    });
    res.json(order);
  } catch (err) {
    console.error('editOrder error:', err);
    res.status(500).json({ message: 'Ошибка при обновлении заказа' });
  }
}

async function removeOrder(req, res) {
  try {
    const deleted = await deleteOrder(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    res.json({ message: 'Заказ удалён', id: deleted.id });
  } catch (err) {
    console.error('removeOrder error:', err);
    res.status(500).json({ message: 'Ошибка при удалении заказа' });
  }
}

module.exports = {
  listOrders,
  getOrder,
  addOrder,
  editOrder,
  removeOrder,
};
