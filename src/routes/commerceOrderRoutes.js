const express = require('express');
const orderController = require('../controllers/orderController');
const {
  mongoIdParamRule,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.get('/', orderController.commerceOrders);
router.get('/:id', mongoIdParamRule(), handleValidationErrors('/commerce/orders'), orderController.commerceOrderDetail);
router.post('/:id/process', mongoIdParamRule(), handleValidationErrors('/commerce/orders'), orderController.processOrder);

module.exports = router;
