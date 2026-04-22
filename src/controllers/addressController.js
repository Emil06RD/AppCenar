const { apiRequestWithSession } = require('../services/api');
const { handleApiPageError } = require('../utils/apiController');

function mapAddress(address = {}) {
  return {
    _id: address.id || address._id,
    label: address.label,
    street: address.street,
    sector: address.sector,
    city: address.city,
    reference: address.reference,
  };
}

exports.list = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/addresses');

    res.render('client/addresses/list', {
      title: 'Mis direcciones',
      addresses: (response.data || []).map(mapAddress),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar las direcciones.', '/client/home');
  }
};

exports.createForm = (req, res) => {
  res.render('client/addresses/create', { title: 'Nueva direccion' });
};

exports.create = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/addresses', {
      method: 'POST',
      body: {
        label: req.body.label,
        street: req.body.street,
        sector: req.body.sector,
        city: req.body.city,
        reference: req.body.reference,
      },
    });

    req.flash('success', response.message || 'Direccion creada correctamente.');
    return res.redirect('/client/addresses');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al crear la direccion.', '/client/addresses/create');
  }
};

exports.editForm = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/addresses/${req.params.id}`);

    res.render('client/addresses/edit', {
      title: 'Editar direccion',
      address: {
        ...mapAddress(response.data),
        ...res.locals.formData,
      },
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar la direccion.', '/client/addresses');
  }
};

exports.update = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/addresses/${req.params.id}`, {
      method: 'PUT',
      body: {
        label: req.body.label,
        street: req.body.street,
        sector: req.body.sector,
        city: req.body.city,
        reference: req.body.reference,
      },
    });

    req.flash('success', response.message || 'Direccion actualizada correctamente.');
    return res.redirect('/client/addresses');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al actualizar la direccion.', `/client/addresses/${req.params.id}/edit`);
  }
};

exports.destroy = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/addresses/${req.params.id}`, {
      method: 'DELETE',
    });

    req.flash('success', response.message || 'Direccion eliminada correctamente.');
    return res.redirect('/client/addresses');
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al eliminar la direccion.', '/client/addresses');
  }
};
