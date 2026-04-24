const {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} = require('../queries/clientQueries');

async function listClients(req, res) {
  try {
    const clients = await getAllClients();
    res.json(clients);
  } catch (err) {
    console.error('listClients error:', err);
    res.status(500).json({ message: 'Ошибка при получении списка клиентов' });
  }
}

async function getClient(req, res) {
  try {
    const client = await getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }
    res.json(client);
  } catch (err) {
    console.error('getClient error:', err);
    res.status(500).json({ message: 'Ошибка при получении клиента' });
  }
}

async function addClient(req, res) {
  try {
    const { full_name, phone, email, source, notes } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: 'Имя клиента обязательно' });
    }

    const client = await createClient({ full_name, phone, email, source, notes });
    res.status(201).json(client);
  } catch (err) {
    console.error('addClient error:', err);
    res.status(500).json({ message: 'Ошибка при создании клиента' });
  }
}

async function editClient(req, res) {
  try {
    const { full_name, phone, email, source, notes } = req.body;

    if (!full_name) {
      return res.status(400).json({ message: 'Имя клиента обязательно' });
    }

    const existing = await getClientById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }

    const client = await updateClient(req.params.id, {
      full_name,
      phone,
      email,
      source,
      notes,
    });
    res.json(client);
  } catch (err) {
    console.error('editClient error:', err);
    res.status(500).json({ message: 'Ошибка при обновлении клиента' });
  }
}

async function removeClient(req, res) {
  try {
    const deleted = await deleteClient(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Клиент не найден' });
    }
    res.json({ message: 'Клиент удалён', id: deleted.id });
  } catch (err) {
    console.error('removeClient error:', err);
    res.status(500).json({ message: 'Ошибка при удалении клиента' });
  }
}

module.exports = {
  listClients,
  getClient,
  addClient,
  editClient,
  removeClient,
};
