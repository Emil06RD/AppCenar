const express = require('express');
const orderController = require('../controllers/orderController');
const {
  mongoIdParamRule,
  orderCreateRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.get('/', orderController.clientHistory);
router.get('/create', orderController.createForm);
router.get('/:id', mongoIdParamRule(), handleValidationErrors('/client/orders'), orderController.clientDetail);
router.post('/', orderCreateRules, handleValidationErrors((req) => `/client/orders/create?commerce=${req.body.commerceId || ''}`), orderController.create);

module.exports = router;
