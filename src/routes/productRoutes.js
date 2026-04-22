const express = require('express');
const productController = require('../controllers/productController');
const {
  mongoIdParamRule,
  productRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.get('/', productController.getProductsByCommerce);
router.get('/create', productController.getCreateProductForm);
router.post('/', upload.single('image'), productRules, handleValidationErrors('/commerce/products/create'), productController.createProduct);
router.get('/edit/:id', mongoIdParamRule(), handleValidationErrors('/commerce/products'), productController.getEditProductForm);
router.post('/edit/:id', upload.single('image'), mongoIdParamRule(), productRules, handleValidationErrors((req) => `/commerce/products/edit/${req.params.id}`), productController.updateProduct);
router.post('/delete/:id', mongoIdParamRule(), handleValidationErrors('/commerce/products'), productController.deleteProduct);

module.exports = router;
