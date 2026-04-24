const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  listClients,
  getClient,
  addClient,
  editClient,
  removeClient,
} = require('../controllers/clientController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', addClient);
router.put('/:id', editClient);
router.delete('/:id', removeClient);

module.exports = router;
