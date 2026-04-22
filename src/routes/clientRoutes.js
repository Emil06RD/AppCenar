const express = require('express');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const { requireClient } = require('../middlewares/roleMiddleware');
const clientController = require('../controllers/clientController');
const addressRoutes = require('./addressRoutes');
const orderRoutes = require('./orderRoutes');
const {
  favoriteRules,
  profileRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');

const router = express.Router();

router.use(isAuthenticated, requireClient);

router.get('/home', clientController.home);
router.get('/profile', clientController.profileForm);
router.post('/profile', profileRules, handleValidationErrors('/client/profile'), clientController.updateProfile);
router.get('/commerces', clientController.listCommerces);
router.get('/commerces/:id/products', clientController.viewProducts);
router.get('/favorites', clientController.listFavorites);
router.post('/favorites', favoriteRules, handleValidationErrors('/client/commerces'), clientController.addFavorite);
router.post('/favorites/remove', favoriteRules, handleValidationErrors('/client/favorites'), clientController.removeFavorite);
router.use('/addresses', addressRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
