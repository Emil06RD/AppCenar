const express              = require('express');
const router               = express.Router();
const { isAuthenticated }  = require('../middlewares/authMiddleware');
const { requireDelivery }  = require('../middlewares/roleMiddleware');
const deliveryOrderRoutes  = require('./deliveryOrderRoutes');
const deliveryController   = require('../controllers/deliveryController');
const {
  profileRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

router.use(isAuthenticated, requireDelivery);

router.get('/home', deliveryController.home);
router.get('/profile', deliveryController.profileForm);
router.post('/profile', profileRules, handleValidationErrors('/delivery/profile'), deliveryController.updateProfile);
router.post('/availability/toggle', deliveryController.toggleAvailability);

router.use('/orders', deliveryOrderRoutes);

module.exports = router;
