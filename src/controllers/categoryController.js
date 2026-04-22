const { apiRequestWithSession } = require('../services/api');
const { handleApiPageError, getApiErrorMessage } = require('../utils/apiController');

function mapCategory(category = {}) {
  return {
    _id: category._id || category.id,
    name: category.name,
    description: category.description,
    totalProducts: category.totalProducts || 0,
  };
}

exports.getCategoriesByCommerce = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/categories');

    return res.render('commerce/categories/list', {
      title: 'Mis categorias',
      categories: (response.data || []).map(mapCategory),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar las categorias.', '/commerce/home');
  }
};

exports.getCreateCategoryForm = (req, res) => {
  return res.render('commerce/categories/create', {
    title: 'Nueva categoria',
  });
};

exports.createCategory = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/categories', {
      method: 'POST',
      body: {
        name: req.body.name,
        description: req.body.description,
      },
    });

    req.flash('success', response.message || 'Categoria creada correctamente.');
    return res.redirect('/commerce/categories');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al crear la categoria.', '/commerce/categories/create');
  }
};

exports.getEditCategoryForm = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/categories/${req.params.id}`);

    return res.render('commerce/categories/edit', {
      title: 'Editar categoria',
      category: {
        ...mapCategory(response.data),
        ...res.locals.formData,
      },
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar la categoria.', '/commerce/categories');
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/categories/${req.params.id}`, {
      method: 'PUT',
      body: {
        name: req.body.name,
        description: req.body.description,
      },
    });

    req.flash('success', response.message || 'Categoria actualizada correctamente.');
    return res.redirect('/commerce/categories');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al actualizar la categoria.', `/commerce/categories/edit/${req.params.id}`);
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/categories/${req.params.id}`, {
      method: 'DELETE',
    });

    req.flash('success', response.message || 'Categoria eliminada correctamente.');
    return res.redirect('/commerce/categories');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo eliminar la categoria.'));
    return res.redirect('/commerce/categories');
  }
};

exports.list = exports.getCategoriesByCommerce;
exports.createForm = exports.getCreateCategoryForm;
exports.create = exports.createCategory;
exports.editForm = exports.getEditCategoryForm;
exports.update = exports.updateCategory;
exports.remove = exports.deleteCategory;
