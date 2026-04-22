const { apiRequestWithSession } = require('../services/api');
const { handleApiPageError, getApiErrorMessage } = require('../utils/apiController');

function mapCommerceTypes(items = [], selectedType = '') {
  return items.map((commerceType) => ({
    _id: commerceType.id || commerceType._id,
    name: commerceType.name,
    description: commerceType.description,
    selected: String(selectedType || '') === String(commerceType.id || commerceType._id),
  }));
}

function mapCommerceItem(commerce = {}) {
  const owner = commerce.owner || {};

  return {
    _id: commerce.id || commerce._id,
    commerceId: commerce.id || commerce._id,
    name: commerce.name,
    logo: commerce.logo,
    openingTime: commerce.openingTime,
    closingTime: commerce.closingTime,
    commerceType: commerce.commerceType || {},
    ownerName: [owner.firstName, owner.lastName].filter(Boolean).join(' '),
    profileImage: owner.profileImage || null,
    isFavorite: Boolean(commerce.isFavorite),
  };
}

exports.profileForm = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/account/me');
    const account = response.data;

    res.render('client/profile/edit', {
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
    return handleApiPageError(req, res, error, 'Error al cargar el perfil.', '/client/home');
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
    };

    req.flash('success', response.message || 'Perfil actualizado correctamente.');
    return res.redirect('/client/profile');
  } catch (error) {
    req.flash('formData', JSON.stringify(req.body));
    return handleApiPageError(req, res, error, 'Error al actualizar el perfil.', '/client/profile');
  }
};

exports.home = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/commerce-types');

    res.render('client/home', {
      title: 'Inicio',
      commerceTypes: mapCommerceTypes(response.data),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar los tipos de comercio.', '/');
  }
};

exports.listCommerces = async (req, res) => {
  const selectedType = req.query.type || '';
  const search = req.query.search || '';

  try {
    const [commerceTypesResponse, commercesResponse] = await Promise.all([
      apiRequestWithSession(req, '/commerce-types'),
      apiRequestWithSession(req, '/commerce', {
        query: {
          commerceTypeId: selectedType,
          search,
        },
      }),
    ]);

    res.render('client/commerces/list', {
      title: 'Comercios',
      commerces: (commercesResponse.data || []).map(mapCommerceItem),
      commerceTypes: mapCommerceTypes(commerceTypesResponse.data, selectedType),
      selectedType,
      search,
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar los comercios.', '/client/home');
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/favorites', {
      method: 'POST',
      body: {
        commerceId: req.body.commerceId,
      },
    });

    req.flash('success', response.message || 'Comercio agregado a favoritos.');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo agregar el favorito.'));
  }

  return res.redirect(req.get('Referer') || '/client/commerces');
};

exports.removeFavorite = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/favorites/${req.body.commerceId}`, {
      method: 'DELETE',
    });

    req.flash('success', response.message || 'Comercio eliminado de favoritos.');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo eliminar el favorito.'));
  }

  return res.redirect(req.get('Referer') || '/client/favorites');
};

exports.listFavorites = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/favorites');

    res.render('client/favorites/list', {
      title: 'Mis Favoritos',
      commerces: (response.data || []).map(mapCommerceItem),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar tus favoritos.', '/client/home');
  }
};

exports.viewProducts = async (req, res) => {
  const commerceId = req.params.id;
  const selectedCategory = req.query.category || '';

  try {
    const response = await apiRequestWithSession(req, `/commerce/${commerceId}/catalog`);
    const catalog = response.data;

    const categories = (catalog.categories || []).map((category) => ({
      _id: category.id || category._id,
      name: category.name,
      description: category.description,
      selected: String(selectedCategory || '') === String(category.id || category._id),
    }));

    const groupedProducts = (catalog.categories || [])
      .filter((category) => !selectedCategory || String(category.id) === String(selectedCategory))
      .map((category) => ({
        _id: category.id || category._id,
        name: category.name,
        description: category.description,
        products: (category.products || []).map((product) => ({
          _id: product.id || product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          image: product.image,
          category: {
            _id: category.id || category._id,
            name: category.name,
          },
        })),
      }))
      .filter((group) => group.products.length > 0);

    res.render('client/products/list', {
      title: `Productos de ${catalog.commerce.name}`,
      commerce: {
        id: catalog.commerce.id || catalog.commerce._id,
        name: catalog.commerce.name,
        openingTime: catalog.commerce.openingTime,
        closingTime: catalog.commerce.closingTime,
        commerceType: catalog.commerce.commerceType || {},
      },
      groupedProducts,
      categories,
      selectedCategory,
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el catalogo.', '/client/commerces');
  }
};
