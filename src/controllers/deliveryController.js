const { apiRequestWithSession } = require('../services/api');
const { handleApiPageError } = require('../utils/apiController');

exports.home = async (req, res) => {
  try {
    const [accountResponse, ordersResponse] = await Promise.all([
      apiRequestWithSession(req, '/account/me'),
      apiRequestWithSession(req, '/orders/delivery', {
        query: { status: 'InProgress', pageSize: 1 },
      }),
    ]);

    res.render('delivery/home', {
      title: 'Mis entregas',
      delivery: accountResponse.data,
      activeOrder: (ordersResponse.data || [])[0] || null,
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el panel del delivery.', '/auth/login');
  }
};

exports.profileForm = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/account/me');
    const account = response.data;

    res.render('delivery/profile/edit', {
      title: 'Mi perfil',
      profile: {
        firstName: account.firstName,
        lastName: account.lastName,
        userName: account.userName,
        email: account.email,
        phone: account.phone,
        ...res.locals.formData,
      },
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el perfil.', '/delivery/home');
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
      isAvailable: response.data.isAvailable,
    };

    req.flash('success', response.message || 'Perfil actualizado correctamente.');
    return res.redirect('/delivery/profile');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al actualizar el perfil.', '/delivery/profile');
  }
};

exports.toggleAvailability = async (req, res) => {
  req.flash('error', 'La API actual no expone un endpoint para cambiar la disponibilidad manualmente.');
  return res.redirect('/delivery/home');
};
