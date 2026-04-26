const {
  getAllRequests,
  getRequestById,
  createRequest,
  updateRequest,
  deleteRequest,
} = require('../queries/requestQueries');
const { getClientById } = require('../queries/clientQueries');
const { convertRequestToOrder } = require('../queries/orderQueries');

const ALLOWED_STATUSES = [
  'новая',
  'в обработке',
  'подтверждена',
  'отклонена',
  'переведена в заказ',
];

async function listRequests(req, res) {
  try {
    const requests = await getAllRequests(req.user.id);
    res.json(requests);
  } catch (err) {
    console.error('listRequests error:', err);
    res.status(500).json({ message: 'Ошибка при получении списка заявок' });
  }
}

async function getRequest(req, res) {
  try {
    const request = await getRequestById(req.params.id, req.user.id);
    if (!request) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }
    res.json(request);
  } catch (err) {
    console.error('getRequest error:', err);
    res.status(500).json({ message: 'Ошибка при получении заявки' });
  }
}

async function addRequest(req, res) {
  try {
    const { client_id, title, description, service_type, status } = req.body;

    if (!client_id || !title) {
      return res.status(400).json({ message: 'Поля client_id и title обязательны' });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус заявки' });
    }

    const client = await getClientById(client_id, req.user.id);
    if (!client) {
      return res.status(400).json({ message: 'Клиент не найден или принадлежит другому пользователю' });
    }

    const request = await createRequest({
      user_id: req.user.id,
      client_id,
      title,
      description,
      service_type,
      status,
    });
    res.status(201).json(request);
  } catch (err) {
    console.error('addRequest error:', err);
    res.status(500).json({ message: 'Ошибка при создании заявки' });
  }
}

async function editRequest(req, res) {
  try {
    const { title, description, service_type, status } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Поле title обязательно' });
    }

    if (status && !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Недопустимый статус заявки' });
    }

    const existing = await getRequestById(req.params.id, req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }

    const request = await updateRequest(req.params.id, req.user.id, {
      title,
      description,
      service_type,
      status: status || existing.status,
    });
    res.json(request);
  } catch (err) {
    console.error('editRequest error:', err);
    res.status(500).json({ message: 'Ошибка при обновлении заявки' });
  }
}

async function removeRequest(req, res) {
  try {
    const deleted = await deleteRequest(req.params.id, req.user.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }
    res.json({ message: 'Заявка удалена', id: deleted.id });
  } catch (err) {
    console.error('removeRequest error:', err);
    res.status(500).json({ message: 'Ошибка при удалении заявки' });
  }
}

async function convertRequest(req, res) {
  try {
    const { service_name, amount, deadline, comment } = req.body;

    const result = await convertRequestToOrder(req.params.id, req.user.id, {
      service_name,
      amount,
      deadline,
      comment,
    });

    if (result.error) {
      return res.status(404).json({ message: result.error });
    }

    res.status(201).json({
      message: 'Заявка переведена в заказ',
      order: result.order,
    });
  } catch (err) {
    console.error('convertRequest error:', err);
    res.status(500).json({ message: 'Ошибка при переводе заявки в заказ' });
  }
}

module.exports = {
  listRequests,
  getRequest,
  addRequest,
  editRequest,
  removeRequest,
  convertRequest,
};
