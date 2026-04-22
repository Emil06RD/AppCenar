const express = require('express');
const addressController = require('../controllers/addressController');
const {
  mongoIdParamRule,
  addressRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.get('/', addressController.list);
router.get('/create', addressController.createForm);
router.post('/create', addressRules, handleValidationErrors('/client/addresses/create'), addressController.create);
router.get('/:id/edit', mongoIdParamRule(), handleValidationErrors('/client/addresses'), addressController.editForm);
router.post('/:id/edit', mongoIdParamRule(), addressRules, handleValidationErrors((req) => `/client/addresses/${req.params.id}/edit`), addressController.update);
router.post('/:id/delete', mongoIdParamRule(), handleValidationErrors('/client/addresses'), addressController.destroy);

module.exports = router;
