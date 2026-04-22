const express = require('express');
const productController = require('../controllers/productController');
const {
  mongoIdParamRule,
  productRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.get('/', productController.getProductsByCommerce);
router.get('/create', productController.getCreateProductForm);
router.post('/', productRules, handleValidationErrors('/commerce/products/create'), productController.createProduct);
router.get('/edit/:id', mongoIdParamRule(), handleValidationErrors('/commerce/products'), productController.getEditProductForm);
router.post('/edit/:id', mongoIdParamRule(), productRules, handleValidationErrors((req) => `/commerce/products/edit/${req.params.id}`), productController.updateProduct);
router.post('/toggle/:id', mongoIdParamRule(), handleValidationErrors('/commerce/products'), productController.toggleProductStatus);

module.exports = router;
