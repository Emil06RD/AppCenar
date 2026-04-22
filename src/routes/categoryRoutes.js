const express = require('express');
const categoryController = require('../controllers/categoryController');
const {
  mongoIdParamRule,
  categoryRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.get('/', categoryController.getCategoriesByCommerce);
router.get('/create', categoryController.getCreateCategoryForm);
router.post('/', categoryRules, handleValidationErrors('/commerce/categories/create'), categoryController.createCategory);
router.get('/edit/:id', mongoIdParamRule(), handleValidationErrors('/commerce/categories'), categoryController.getEditCategoryForm);
router.post('/edit/:id', mongoIdParamRule(), categoryRules, handleValidationErrors((req) => `/commerce/categories/edit/${req.params.id}`), categoryController.updateCategory);
router.post('/toggle/:id', mongoIdParamRule(), handleValidationErrors('/commerce/categories'), categoryController.toggleCategoryStatus);

module.exports = router;
