const { apiRequestWithSession } = require('../services/api');
const { handleApiPageError, getApiErrorMessage } = require('../utils/apiController');

function mapUser(user = {}) {
  const roleCode = String(user.role?.code || '').toLowerCase();

  return {
    _id: user._id || user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    userName: user.userName,
    email: user.email,
    phone: user.phone,
    isActive: Boolean(user.isActive),
    isDefaultAdmin: Boolean(user.isDefaultAdmin),
    role: roleCode || String(user.role?.name || '').toLowerCase(),
    roleLabel: user.role?.name || user.role?.code || '',
    isCurrent: String(user._id || user.id) === String(user.authenticatedUserId || ''),
  };
}

function getUsersEndpointByRole(role) {
  const endpoints = {
    client: '/admin/users/clients',
    delivery: '/admin/users/deliveries',
    commerce: '/admin/users/commerces',
    admin: '/admin/users/admins',
  };

  return endpoints[role] || null;
}

async function loadUsers(req) {
  const role = req.query.role || '';
  const search = req.query.search || '';
  const isActive = req.query.isActive || '';
  const query = {
    search,
    isActive,
    pageSize: 50,
  };

  if (role) {
    const response = await apiRequestWithSession(req, getUsersEndpointByRole(role), { query });
    return { users: response.data || [], selectedRole: role, search, isActive };
  }

  const roles = ['client', 'delivery', 'commerce', 'admin'];
  const responses = await Promise.all(
    roles.map((currentRole) =>
      apiRequestWithSession(req, getUsersEndpointByRole(currentRole), { query })
    )
  );

  return {
    users: responses.flatMap((response) => response.data || []),
    selectedRole: '',
    search,
    isActive,
  };
}

exports.dashboard = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/admin/dashboard');

    res.render('admin/dashboard', {
      title: 'Panel de Administracion',
      stats: response.data,
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el dashboard.', '/auth/login');
  }
};

exports.listUsers = async (req, res) => {
  try {
    const result = await loadUsers(req);

    res.render('admin/users/list', {
      title: 'Usuarios',
      users: (result.users || []).map((user) => ({
        ...mapUser(user),
        authenticatedUserId: req.session.userId,
      })),
      selectedRole: result.selectedRole,
      search: result.search,
      selectedIsActive: result.isActive,
      roleFilters: {
        client: result.selectedRole === 'client',
        commerce: result.selectedRole === 'commerce',
        delivery: result.selectedRole === 'delivery',
        admin: result.selectedRole === 'admin',
      },
      statusFilters: {
        active: result.isActive === 'true',
        inactive: result.isActive === 'false',
      },
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar los usuarios.', '/admin');
  }
};

exports.toggleUser = async (req, res) => {
  try {
    const nextStatus = req.body.currentStatus !== 'true';
    const response = await apiRequestWithSession(req, `/admin/users/${req.params.id}/status`, {
      method: 'PATCH',
      body: { isActive: nextStatus },
    });

    req.flash('success', response.message || 'Estado actualizado correctamente.');
    return res.redirect(req.get('Referer') || '/admin/users');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo cambiar el estado del usuario.'));
    return res.redirect(req.get('Referer') || '/admin/users');
  }
};

exports.approveCommerce = async (req, res) => {
  req.flash('error', 'La API actual no expone un flujo de aprobacion de comercios.');
  return res.redirect('/admin/users?role=commerce');
};

exports.configForm = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/configurations/ITBIS');

    res.render('admin/configuration', {
      title: 'Configuracion',
      config: {
        key: response.data.key,
        itbis: response.data.value,
      },
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar la configuracion.', '/admin');
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/configurations/ITBIS', {
      method: 'PUT',
      body: { value: req.body.itbis },
    });

    req.flash('success', response.message || 'Configuracion actualizada correctamente.');
    return res.redirect('/admin/configuration');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo actualizar la configuracion.'));
    return res.redirect('/admin/configuration');
  }
};

exports.listAdministrators = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/admin/users/admins', {
      query: { pageSize: 50 },
    });

    res.render('admin/administrators/list', {
      title: 'Administradores',
      admins: (response.data || []).map((admin) => ({
        ...mapUser(admin),
        isCurrent: String(admin._id || admin.id) === String(req.session.userId),
      })),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar los administradores.', '/admin');
  }
};

exports.createAdministratorForm = (req, res) => {
  res.render('admin/administrators/create', {
    title: 'Nuevo administrador',
    admin: {
      ...res.locals.formData,
    },
  });
};

exports.createAdministrator = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/admin/users/admins', {
      method: 'POST',
      body: req.body,
    });

    req.flash('success', response.message || 'Administrador creado correctamente.');
    return res.redirect('/admin/administrators');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al crear el administrador.', '/admin/administrators/create');
  }
};

exports.editAdministratorForm = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/admin/users/admins', {
      query: { pageSize: 100 },
    });

    const admin = (response.data || []).find(
      (item) => String(item._id || item.id) === String(req.params.id)
    );

    if (!admin) {
      req.flash('error', 'Administrador no encontrado.');
      return res.redirect('/admin/administrators');
    }

    res.render('admin/administrators/edit', {
      title: 'Editar administrador',
      admin: {
        ...mapUser(admin),
        ...res.locals.formData,
      },
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el administrador.', '/admin/administrators');
  }
};

exports.updateAdministrator = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/admin/users/admins/${req.params.id}`, {
      method: 'PUT',
      body: req.body,
    });

    req.flash('success', response.message || 'Administrador actualizado correctamente.');
    return res.redirect('/admin/administrators');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al actualizar el administrador.', `/admin/administrators/${req.params.id}/edit`);
  }
};

exports.deleteAdministrator = async (req, res) => {
  req.flash('error', 'La API actual no expone eliminacion de administradores.');
  return res.redirect('/admin/administrators');
};
