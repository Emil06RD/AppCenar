const express        = require('express');
const router         = express.Router();
const authController = require('../controllers/authController');
const {
  loginRules,
  registerUserRules,
  registerCommerceRules,
  forgotPasswordRules,
  resetPasswordRules,
  handleValidationErrors,
} = require('../middlewares/validationMiddleware');
const { redirectIfAuthenticated } = require('../middlewares/authMiddleware');

// -- Login (bloquea acceso si ya hay sesión) -----------------------------------
router.get('/login',  redirectIfAuthenticated, authController.getLogin);
router.post('/login', loginRules, handleValidationErrors('/auth/login'), authController.postLogin);

// -- Logout --------------------------------------------------------------------
router.get('/logout', authController.logout);

// -- Registro de usuario (bloquea si ya está logueado) -------------------------
router.get('/register-user',  redirectIfAuthenticated, authController.getRegisterUser);
router.post(
  '/register-user',
  registerUserRules,
  handleValidationErrors('/auth/register-user'),
  authController.postRegisterUser
);

// -- Registro de comercio (bloquea si ya está logueado) ------------------------
router.get('/register-commerce',  redirectIfAuthenticated, authController.getRegisterCommerce);
router.post(
  '/register-commerce',
  registerCommerceRules,
  handleValidationErrors('/auth/register-commerce'),
  authController.postRegisterCommerce
);

// -- Recuperar contraseña ------------------------------------------------------
router.get('/forgot-password', redirectIfAuthenticated, authController.getForgotPassword);
router.post(
  '/forgot-password',
  redirectIfAuthenticated,
  forgotPasswordRules,
  handleValidationErrors('/auth/forgot-password'),
  authController.postForgotPassword
);

// -- Restablecer contraseña ----------------------------------------------------
router.get('/reset-password/:token', authController.getResetPassword);
router.post(
  '/reset-password/:token',
  resetPasswordRules,
  handleValidationErrors('/auth/forgot-password'),
  authController.postResetPassword
);

// -- Activación de cuenta ------------------------------------------------------
router.get('/activate/:token', authController.getActivateAccount);

module.exports = router;
