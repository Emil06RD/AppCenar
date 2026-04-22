const { apiRequestWithSession } = require('../services/api');
const { handleApiPageError, getApiErrorMessage } = require('../utils/apiController');
const { buildMultipartFormData } = require('../utils/multipart');

function mapCategoriesWithSelection(categories, selectedCategoryId) {
  return categories.map((category) => ({
    _id: category._id || category.id,
    name: category.name,
    description: category.description,
    selected: selectedCategoryId
      ? String(category._id || category.id) === String(selectedCategoryId)
      : false,
  }));
}

function mapProduct(product = {}) {
  return {
    _id: product._id || product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    image: product.image,
    isActive: product.isActive !== false,
    category: product.categoryId
      ? {
          _id: product.categoryId._id || product.categoryId.id,
          name: product.categoryId.name,
          description: product.categoryId.description,
        }
      : null,
  };
}

async function loadCategories(req) {
  const response = await apiRequestWithSession(req, '/categories');
  return response.data || [];
}

exports.getProductsByCommerce = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/products');

    return res.render('commerce/products/list', {
      title: 'Mis productos',
      products: (response.data || []).map(mapProduct),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar los productos.', '/commerce/home');
  }
};

exports.getCreateProductForm = async (req, res) => {
  try {
    const categories = await loadCategories(req);

    return res.render('commerce/products/create', {
      title: 'Nuevo producto',
      categories: mapCategoriesWithSelection(categories, res.locals.formData.category),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el formulario.', '/commerce/products');
  }
};

exports.createProduct = async (req, res) => {
  try {
    const formData = buildMultipartFormData(
      {
        categoryId: req.body.category,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        isActive: req.body.isActive || 'true',
      },
      req.file ? [req.file] : []
    );

    const response = await apiRequestWithSession(req, '/products', {
      method: 'POST',
      body: formData,
    });

    req.flash('success', response.message || 'Producto creado correctamente.');
    return res.redirect('/commerce/products');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al crear el producto.', '/commerce/products/create');
  }
};

exports.getEditProductForm = async (req, res) => {
  try {
    const [productResponse, categories] = await Promise.all([
      apiRequestWithSession(req, `/products/${req.params.id}`),
      loadCategories(req),
    ]);

    const product = mapProduct(productResponse.data);

    return res.render('commerce/products/edit', {
      title: 'Editar producto',
      product,
      categories: mapCategoriesWithSelection(categories, product.category?._id),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el producto.', '/commerce/products');
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const formData = buildMultipartFormData(
      {
        categoryId: req.body.category,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        isActive: req.body.isActive || 'false',
      },
      req.file ? [req.file] : []
    );

    const response = await apiRequestWithSession(req, `/products/${req.params.id}`, {
      method: 'PUT',
      body: formData,
    });

    req.flash('success', response.message || 'Producto actualizado correctamente.');
    return res.redirect('/commerce/products');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al actualizar el producto.', `/commerce/products/edit/${req.params.id}`);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/products/${req.params.id}`, {
      method: 'DELETE',
    });

    req.flash('success', response.message || 'Producto eliminado correctamente.');
    return res.redirect('/commerce/products');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo eliminar el producto.'));
    return res.redirect('/commerce/products');
  }
};

exports.list = exports.getProductsByCommerce;
exports.createForm = exports.getCreateProductForm;
exports.create = exports.createProduct;
exports.editForm = exports.getEditProductForm;
exports.update = exports.updateProduct;
exports.remove = exports.deleteProduct;
