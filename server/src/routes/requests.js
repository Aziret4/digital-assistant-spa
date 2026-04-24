const express = require('express');
const authMiddleware = require('../middleware/auth');
const {
  listRequests,
  getRequest,
  addRequest,
  editRequest,
  removeRequest,
  convertRequest,
} = require('../controllers/requestController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listRequests);
router.get('/:id', getRequest);
router.post('/', addRequest);
router.put('/:id', editRequest);
router.delete('/:id', removeRequest);
router.post('/:id/convert', convertRequest);

module.exports = router;
