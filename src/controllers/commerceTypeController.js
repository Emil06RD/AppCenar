const { apiRequestWithSession } = require('../services/api');
const { handleApiPageError, getApiErrorMessage } = require('../utils/apiController');
const { buildMultipartFormData } = require('../utils/multipart');

function mapCommerceType(item = {}) {
  return {
    _id: item._id || item.id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    isActive: item.isActive !== false,
  };
}

exports.list = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/admin/commerce-types', {
      query: { pageSize: 100 },
    });

    res.render('admin/commerce-types/list', {
      title: 'Tipos de Comercio',
      commerceTypes: (response.data || []).map(mapCommerceType),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'No se pudieron cargar los tipos de comercio.', '/admin');
  }
};

exports.createForm = (req, res) => {
  res.render('admin/commerce-types/create', {
    title: 'Nuevo Tipo de Comercio',
    commerceType: {
      name: res.locals.formData.name || '',
      description: res.locals.formData.description || '',
      isActive: res.locals.formData.isActive !== 'false',
    },
  });
};

exports.create = async (req, res) => {
  try {
    const formData = buildMultipartFormData(
      {
        name: req.body.name,
        description: req.body.description,
        isActive: req.body.isActive || 'false',
      },
      req.file ? [req.file] : []
    );

    const response = await apiRequestWithSession(req, '/admin/commerce-types', {
      method: 'POST',
      body: formData,
    });

    req.flash('success', response.message || 'Tipo de comercio creado correctamente.');
    return res.redirect('/admin/commerce-types');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'No se pudo crear el tipo de comercio.', '/admin/commerce-types/create');
  }
};

exports.editForm = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/admin/commerce-types/${req.params.id}`);

    res.render('admin/commerce-types/edit', {
      title: 'Editar Tipo de Comercio',
      commerceType: {
        ...mapCommerceType(response.data),
        ...res.locals.formData,
      },
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'No se pudo cargar el tipo de comercio.', '/admin/commerce-types');
  }
};

exports.update = async (req, res) => {
  try {
    const formData = buildMultipartFormData(
      {
        name: req.body.name,
        description: req.body.description,
        isActive: req.body.isActive || 'false',
      },
      req.file ? [req.file] : []
    );

    const response = await apiRequestWithSession(req, `/admin/commerce-types/${req.params.id}`, {
      method: 'PUT',
      body: formData,
    });

    req.flash('success', response.message || 'Tipo de comercio actualizado correctamente.');
    return res.redirect('/admin/commerce-types');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'No se pudo actualizar el tipo de comercio.', `/admin/commerce-types/${req.params.id}/edit`);
  }
};

exports.remove = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/admin/commerce-types/${req.params.id}`, {
      method: 'DELETE',
    });

    req.flash('success', response.message || 'Tipo de comercio eliminado correctamente.');
    return res.redirect('/admin/commerce-types');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo eliminar el tipo de comercio.'));
    return res.redirect('/admin/commerce-types');
  }
};
