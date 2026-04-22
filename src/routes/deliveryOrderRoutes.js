const express = require('express');
const orderController = require('../controllers/orderController');
const {
  mongoIdParamRule,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.get('/', orderController.deliveryOrders);
router.get('/:id', mongoIdParamRule(), handleValidationErrors('/delivery/orders'), orderController.deliveryOrderDetail);
router.post('/:id/complete', mongoIdParamRule(), handleValidationErrors('/delivery/orders'), orderController.completeOrder);

module.exports = router;
