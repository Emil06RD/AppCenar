const CommerceType = require('../models/CommerceType');
const {
  ApiRequestError,
  apiRequest,
  clearSessionAuth,
  roleRedirectPath,
  setSessionAuth,
} = require('../services/api');

function getApiErrorMessage(error, fallback) {
  if (error instanceof ApiRequestError) {
    if (error.errors.length) {
      return error.errors.map((item) => item.msg || item.message || String(item)).join(', ');
    }

    return error.message || fallback;
  }

  return fallback;
}

function buildFormData(payload, file) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    formData.append(key, String(value));
  });

  if (file?.buffer) {
    formData.append(
      file.fieldname,
      new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' }),
      file.originalname || `${file.fieldname}.bin`
    );
  }

  return formData;
}

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Iniciar sesion' });
};

exports.postLogin = async (req, res) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    req.flash('error', 'Ingresa tu usuario o email y la contrasena.');
    req.flash('formData', JSON.stringify({ identifier }));
    return res.redirect('/auth/login');
  }

  try {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: { identifier, password },
    });

    setSessionAuth(req, response.data);
    return res.redirect(roleRedirectPath(req.session.role));
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo iniciar sesion.'));
    req.flash('formData', JSON.stringify({ identifier }));
    return res.redirect('/auth/login');
  }
};

exports.logout = (req, res) => {
  clearSessionAuth(req);
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};

exports.getRegisterUser = (req, res) => {
  res.render('auth/register-user', {
    title: 'Crear cuenta',
    data: res.locals.formData || {},
  });
};

exports.postRegisterUser = async (req, res) => {
  const { role, firstName, lastName, userName, email, phone } = req.body;
  const endpoint = role === 'delivery' ? '/auth/register-delivery' : '/auth/register-client';

  try {
    const response = await apiRequest(endpoint, {
      method: 'POST',
      body: req.body,
    });

    req.flash('success', response.message || 'Cuenta creada correctamente. Revisa tu correo para activarla.');
    return res.redirect('/auth/login');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo crear la cuenta.'));
    req.flash('formData', JSON.stringify({ firstName, lastName, userName, email, phone, role }));
    return res.redirect('/auth/register-user');
  }
};

exports.getRegisterCommerce = async (req, res) => {
  const formData = res.locals.formData || {};

  try {
    const commerceTypes = await CommerceType.find({ isActive: true }).sort({ name: 1 }).lean();

    res.render('auth/register-commerce', {
      title: 'Registrar comercio',
      data: formData,
      commerceTypes: commerceTypes.map((commerceType) => ({
        ...commerceType,
        selected: String(formData.commerceType || '') === String(commerceType._id),
      })),
    });
  } catch (error) {
    console.error('Error cargando tipos de comercio:', error.message);
    res.render('auth/register-commerce', {
      title: 'Registrar comercio',
      data: formData,
      commerceTypes: [],
    });
  }
};

exports.postRegisterCommerce = async (req, res) => {
  const {
    firstName,
    lastName,
    userName,
    email,
    phone,
    password,
    confirmPassword,
    commerceName,
    commerceType,
    openingTime,
    closingTime,
  } = req.body;

  const logo = req.files?.logo?.[0];

  try {
    const formData = buildFormData({
      firstName,
      lastName,
      userName,
      email,
      phone,
      password,
      confirmPassword,
      commerceName,
      commerceTypeId: commerceType,
      commercePhone: phone,
      openingTime,
      closingTime,
    }, logo ? { ...logo, fieldname: 'logo' } : null);

    const response = await apiRequest('/auth/register-commerce', {
      method: 'POST',
      body: formData,
    });

    req.flash('success', response.message || 'Comercio registrado. Revisa tu correo para activarlo.');
    return res.redirect('/auth/login');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo registrar el comercio.'));
    req.flash('formData', JSON.stringify({
      firstName,
      lastName,
      userName,
      email,
      phone,
      commerceName,
      commerceType,
      openingTime,
      closingTime,
    }));
    return res.redirect('/auth/register-commerce');
  }
};

exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { title: 'Recuperar contrasena' });
};

exports.postForgotPassword = async (req, res) => {
  try {
    const response = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: { identifier: req.body.identifier },
    });

    req.flash('success', response.message || 'Si la cuenta existe, se enviaron instrucciones al correo.');
    return res.redirect('/auth/forgot-password');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo procesar la solicitud.'));
    return res.redirect('/auth/forgot-password');
  }
};

exports.getResetPassword = (req, res) => {
  res.render('auth/reset-password', {
    title: 'Nueva contrasena',
    token: req.params.token,
  });
};

exports.postResetPassword = async (req, res) => {
  try {
    const response = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: {
        token: req.params.token,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
      },
    });

    req.flash('success', response.message || 'Contrasena actualizada correctamente.');
    return res.redirect('/auth/login');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo restablecer la contrasena.'));
    return res.redirect(`/auth/reset-password/${req.params.token}`);
  }
};

exports.getActivateAccount = async (req, res) => {
  try {
    const response = await apiRequest('/auth/confirm-email', {
      method: 'POST',
      body: { token: req.params.token },
    });

    req.flash('success', response.message || 'Cuenta activada correctamente.');
    return res.redirect('/auth/login');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo activar la cuenta.'));
    return res.redirect('/auth/login');
  }
};
