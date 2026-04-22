const express = require('express');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const commerceTypeController = require('../controllers/commerceTypeController');
const {
  mongoIdParamRule,
  commerceTypeRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');
const upload = require('../middlewares/uploadMiddleware');

const router = express.Router();

router.use(isAuthenticated, requireAdmin);

router.get('/', commerceTypeController.list);
router.get('/create', commerceTypeController.createForm);
router.post('/create', upload.single('icon'), commerceTypeRules, handleValidationErrors('/admin/commerce-types/create'), commerceTypeController.create);
router.get('/:id/edit', mongoIdParamRule(), handleValidationErrors('/admin/commerce-types'), commerceTypeController.editForm);
router.post('/:id/edit', upload.single('icon'), mongoIdParamRule(), commerceTypeRules, handleValidationErrors((req) => `/admin/commerce-types/${req.params.id}/edit`), commerceTypeController.update);
router.post('/:id/delete', mongoIdParamRule(), handleValidationErrors('/admin/commerce-types'), commerceTypeController.remove);

module.exports = router;
