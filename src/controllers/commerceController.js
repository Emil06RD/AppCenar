const CommerceType = require('../models/CommerceType');
const { apiRequestWithSession } = require('../services/api');
const { handleApiPageError } = require('../utils/apiController');

exports.home = async (req, res) => {
  try {
    const [accountResponse, ordersResponse] = await Promise.all([
      apiRequestWithSession(req, '/account/me'),
      apiRequestWithSession(req, '/orders/commerce', {
        query: { status: 'Pending', pageSize: 5 },
      }),
    ]);

    res.render('commerce/home', {
      title: 'Mi comercio',
      commerce: accountResponse.data.commerceProfile || null,
      pendingOrdersCount: ordersResponse.meta?.total || (ordersResponse.data || []).length,
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el panel del comercio.', '/auth/login');
  }
};

exports.profileForm = async (req, res) => {
  try {
    const [accountResponse, commerceTypes] = await Promise.all([
      apiRequestWithSession(req, '/account/me'),
      CommerceType.find({ isActive: true }).sort({ name: 1 }).lean(),
    ]);

    const account = accountResponse.data;
    const commerceProfile = account.commerceProfile || {};
    const selectedCommerceType = res.locals.formData.commerceType || String(commerceProfile.commerceTypeId?._id || '');

    res.render('commerce/profile/edit', {
      title: 'Editar comercio',
      profile: {
        firstName: account.firstName,
        lastName: account.lastName,
        userName: account.userName,
        email: account.email,
        phone: account.phone,
        commerceName: commerceProfile.name || '',
        commerceType: selectedCommerceType,
        openingTime: commerceProfile.openingTime || '',
        closingTime: commerceProfile.closingTime || '',
        ...res.locals.formData,
      },
      commerceTypes: commerceTypes.map((commerceType) => ({
        ...commerceType,
        selected: String(commerceType._id) === String(selectedCommerceType),
      })),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el perfil del comercio.', '/commerce/home');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/account/me', {
      method: 'PATCH',
      body: {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        userName: req.body.userName,
        email: req.body.email,
        phone: req.body.phone,
        commerceName: req.body.commerceName,
        commercePhone: req.body.phone,
        openingTime: req.body.openingTime,
        closingTime: req.body.closingTime,
        commerceTypeId: req.body.commerceType,
        description: '',
      },
    });

    req.session.userName = response.data.userName;
    req.session.authUser = {
      ...(req.session.authUser || {}),
      firstName: response.data.firstName,
      lastName: response.data.lastName,
      userName: response.data.userName,
      email: response.data.email,
      phone: response.data.phone,
      commerceProfile: response.data.commerceProfile,
    };

    req.flash('success', response.message || 'Perfil del comercio actualizado correctamente.');
    return res.redirect('/commerce/profile');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al actualizar el comercio.', '/commerce/profile');
  }
};
