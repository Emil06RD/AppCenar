const express = require('express');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const adminController = require('../controllers/adminController');
const commerceTypeRoutes = require('./commerceTypeRoutes');
const {
  mongoIdParamRule,
  configRules,
  adminCreateRules,
  adminUpdateRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.use(isAuthenticated, requireAdmin);

router.get('/', adminController.dashboard);
router.get('/users', adminController.listUsers);
router.post('/users/:id/toggle', mongoIdParamRule(), handleValidationErrors('/admin/users'), adminController.toggleUser);
router.post('/users/:id/approve', mongoIdParamRule(), handleValidationErrors('/admin/users'), adminController.approveCommerce);
router.get('/administrators', adminController.listAdministrators);
router.get('/administrators/create', adminController.createAdministratorForm);
router.post('/administrators/create', adminCreateRules, handleValidationErrors('/admin/administrators/create'), adminController.createAdministrator);
router.get('/administrators/:id/edit', mongoIdParamRule(), handleValidationErrors('/admin/administrators'), adminController.editAdministratorForm);
router.post('/administrators/:id/edit', mongoIdParamRule(), adminUpdateRules, handleValidationErrors((req) => `/admin/administrators/${req.params.id}/edit`), adminController.updateAdministrator);
router.post('/administrators/:id/delete', mongoIdParamRule(), handleValidationErrors('/admin/administrators'), adminController.deleteAdministrator);
router.get('/configuration', adminController.configForm);
router.post('/configuration', configRules, handleValidationErrors('/admin/configuration'), adminController.updateConfig);
router.use('/commerce-types', commerceTypeRoutes);

module.exports = router;
