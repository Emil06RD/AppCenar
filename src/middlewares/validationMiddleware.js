const { body, param, validationResult } = require('express-validator');

const registerUserRules = [
  body('firstName').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('lastName').trim().notEmpty().withMessage('El apellido es obligatorio'),
  body('userName')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isAlphanumeric().withMessage('Solo se permiten letras y numeros en el usuario'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no tiene un formato valido')
    .normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('El telefono es obligatorio'),
  body('password')
    .notEmpty().withMessage('La contrasena es obligatoria')
    .isLength({ min: 6 }).withMessage('La contrasena debe tener al menos 6 caracteres'),
  body('confirmPassword')
    .notEmpty().withMessage('Debes confirmar la contrasena')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contrasenas no coinciden');
      }
      return true;
    }),
  body('role')
    .notEmpty().withMessage('El rol es obligatorio')
    .isIn(['client', 'delivery']).withMessage('Rol no permitido'),
];

const registerCommerceRules = [
  body('firstName').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('lastName').trim().notEmpty().withMessage('El apellido es obligatorio'),
  body('userName')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isAlphanumeric().withMessage('Solo se permiten letras y numeros en el usuario'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no tiene un formato valido')
    .normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('El telefono es obligatorio'),
  body('password')
    .notEmpty().withMessage('La contrasena es obligatoria')
    .isLength({ min: 6 }).withMessage('La contrasena debe tener al menos 6 caracteres'),
  body('confirmPassword')
    .notEmpty().withMessage('Debes confirmar la contrasena')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contrasenas no coinciden');
      }
      return true;
    }),
  body('commerceName').trim().notEmpty().withMessage('El nombre del comercio es obligatorio'),
  body('commerceType').trim().notEmpty().withMessage('El tipo de comercio es obligatorio'),
  body('openingTime')
    .trim()
    .notEmpty().withMessage('La hora de apertura es obligatoria')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Formato de hora invalido (HH:MM)'),
  body('closingTime')
    .trim()
    .notEmpty().withMessage('La hora de cierre es obligatoria')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Formato de hora invalido (HH:MM)'),
];

const loginRules = [
  body('identifier').trim().notEmpty().withMessage('Ingresa tu usuario o email'),
  body('password').notEmpty().withMessage('La contrasena es obligatoria'),
];

const forgotPasswordRules = [
  body('identifier').trim().notEmpty().withMessage('Ingresa tu email o nombre de usuario'),
];

const resetPasswordRules = [
  body('password')
    .notEmpty().withMessage('La contrasena es obligatoria')
    .isLength({ min: 6 }).withMessage('La contrasena debe tener al menos 6 caracteres'),
  body('confirmPassword')
    .notEmpty().withMessage('Debes confirmar la contrasena')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contrasenas no coinciden');
      }
      return true;
    }),
];

const mongoIdParamRule = (field = 'id') => [
  param(field).isMongoId().withMessage('Identificador invalido'),
];

const categoryRules = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
];

const productRules = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('description').optional({ values: 'falsy' }).trim(),
  body('price')
    .notEmpty().withMessage('El precio es obligatorio')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un numero valido'),
  body('stock')
    .notEmpty().withMessage('El stock es obligatorio')
    .isInt({ min: 0 }).withMessage('El stock debe ser un numero entero valido'),
  body('category')
    .notEmpty().withMessage('La categoria es obligatoria')
    .isMongoId().withMessage('La categoria seleccionada no es valida'),
];

const addressRules = [
  body('street').trim().notEmpty().withMessage('La calle es obligatoria'),
  body('city').trim().notEmpty().withMessage('La ciudad es obligatoria'),
  body('reference').optional({ values: 'falsy' }).trim(),
];

const favoriteRules = [
  body('commerceId')
    .notEmpty().withMessage('El comercio es obligatorio')
    .isMongoId().withMessage('El comercio seleccionado no es valido'),
];

const orderCreateRules = [
  body('commerceId')
    .notEmpty().withMessage('El comercio es obligatorio')
    .isMongoId().withMessage('El comercio seleccionado no es valido'),
  body('addressId')
    .notEmpty().withMessage('Debes seleccionar una direccion')
    .isMongoId().withMessage('La direccion seleccionada no es valida'),
  body('quantities').custom((value) => {
    if (!value || typeof value !== 'object') {
      throw new Error('El pedido no puede estar vacio');
    }

    const hasAtLeastOneProduct = Object.values(value).some((qty) => {
      const quantity = parseInt(qty, 10);
      return Number.isInteger(quantity) && quantity > 0;
    });

    if (!hasAtLeastOneProduct) {
      throw new Error('El pedido no puede estar vacio');
    }

    return true;
  }),
];

const commerceTypeRules = [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('description').optional({ values: 'falsy' }).trim(),
];

const configRules = [
  body('itbis')
    .notEmpty().withMessage('El ITBIS es obligatorio')
    .isFloat({ min: 0, max: 100 }).withMessage('El ITBIS debe ser un numero entre 0 y 100'),
];

const profileRules = [
  body('firstName').trim().notEmpty().withMessage('El nombre es obligatorio'),
  body('lastName').trim().notEmpty().withMessage('El apellido es obligatorio'),
  body('userName')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isAlphanumeric().withMessage('Solo se permiten letras y numeros en el usuario'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no tiene un formato valido')
    .normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('El telefono es obligatorio'),
];

const commerceProfileRules = [
  ...profileRules,
  body('commerceName').trim().notEmpty().withMessage('El nombre del comercio es obligatorio'),
  body('commerceType')
    .trim()
    .notEmpty().withMessage('El tipo de comercio es obligatorio')
    .isMongoId().withMessage('El tipo de comercio seleccionado no es valido'),
  body('openingTime')
    .trim()
    .notEmpty().withMessage('La hora de apertura es obligatoria')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Formato de hora invalido (HH:MM)'),
  body('closingTime')
    .trim()
    .notEmpty().withMessage('La hora de cierre es obligatoria')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Formato de hora invalido (HH:MM)'),
];

const adminCreateRules = [
  ...profileRules,
  body('password')
    .notEmpty().withMessage('La contrasena es obligatoria')
    .isLength({ min: 6 }).withMessage('La contrasena debe tener al menos 6 caracteres'),
  body('confirmPassword')
    .notEmpty().withMessage('Debes confirmar la contrasena')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contrasenas no coinciden');
      }
      return true;
    }),
];

const adminUpdateRules = [
  ...profileRules,
  body('password')
    .optional({ values: 'falsy' })
    .isLength({ min: 6 }).withMessage('La contrasena debe tener al menos 6 caracteres'),
  body('confirmPassword').custom((value, { req }) => {
    if (req.body.password && value !== req.body.password) {
      throw new Error('Las contrasenas no coinciden');
    }
    return true;
  }),
];

const handleValidationErrors = (redirectPath) => (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('errors', errors.array().map((error) => error.msg));
    req.flash('formData', JSON.stringify(req.body));
    const resolvedPath = typeof redirectPath === 'function' ? redirectPath(req) : redirectPath;
    return res.redirect(resolvedPath);
  }

  next();
};

module.exports = {
  registerUserRules,
  registerCommerceRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  mongoIdParamRule,
  categoryRules,
  productRules,
  addressRules,
  favoriteRules,
  orderCreateRules,
  commerceTypeRules,
  configRules,
  profileRules,
  commerceProfileRules,
  adminCreateRules,
  adminUpdateRules,
  handleValidationErrors,
};
