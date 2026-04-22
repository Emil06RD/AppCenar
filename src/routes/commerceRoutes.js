const express              = require('express');
const router               = express.Router();
const { isAuthenticated }  = require('../middlewares/authMiddleware');
const { requireCommerce }  = require('../middlewares/roleMiddleware');
const categoryRoutes       = require('./categoryRoutes');
const commerceOrderRoutes  = require('./commerceOrderRoutes');
const productRoutes        = require('./productRoutes');
const commerceController   = require('../controllers/commerceController');
const {
  commerceProfileRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

router.use(isAuthenticated, requireCommerce);

router.get('/home', commerceController.home);
router.get('/profile', commerceController.profileForm);
router.post('/profile', commerceProfileRules, handleValidationErrors('/commerce/profile'), commerceController.updateProfile);

router.use('/categories', categoryRoutes);

router.use('/products', productRoutes);
router.use('/orders', commerceOrderRoutes);

module.exports = router;
