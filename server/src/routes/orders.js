const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  listOrders,
  getOrder,
  addOrder,
  editOrder,
  removeOrder,
} = require('../controllers/orderController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', addOrder);
router.put('/:id', editOrder);
router.delete('/:id', removeOrder);

module.exports = router;
