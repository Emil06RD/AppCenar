const User = require('../models/User');
const Commerce = require('../models/Commerce');
const Product = require('../models/Product');
const Favorite = require('../models/Favorite');
const CommerceType = require('../models/CommerceType');
const Category = require('../models/Category');

exports.profileForm = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId, role: 'client' }).lean();
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/client/home');
    }

    res.render('client/profile/edit', {
      title: 'Mi perfil',
      profile: {
        ...user,
        ...res.locals.formData,
      },
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el perfil');
    res.redirect('/client/home');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId, role: 'client' });
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/client/home');
    }

    const { firstName, lastName, userName, email, phone } = req.body;
    const normalizedUserName = userName.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const [existingUserName, existingEmail] = await Promise.all([
      User.findOne({ _id: { $ne: user._id }, userName: normalizedUserName }).lean(),
      User.findOne({ _id: { $ne: user._id }, email: normalizedEmail }).lean(),
    ]);

    if (existingUserName) {
      req.flash('error', 'Ese nombre de usuario ya esta en uso');
      return res.redirect('/client/profile');
    }

    if (existingEmail) {
      req.flash('error', 'Ya existe una cuenta con ese email');
      return res.redirect('/client/profile');
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.userName = normalizedUserName;
    user.email = normalizedEmail;
    user.phone = phone.trim();
    await user.save();

    req.session.userName = user.userName;
    req.flash('success', 'Perfil actualizado correctamente');
    res.redirect('/client/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar el perfil');
    res.redirect('/client/profile');
  }
};

exports.home = async (req, res) => {
  try {
    const commerceTypes = await CommerceType.find({ isActive: true }).sort('name').lean();

    res.render('client/home', {
      title: 'Inicio',
      commerceTypes,
    });
  } catch (err) {
    console.error(err);
    res.render('client/home', { title: 'Inicio', commerceTypes: [] });
  }
};

exports.listCommerces = async (req, res) => {
  try {
    const { type, search } = req.query;
    const commerceQuery = { isActive: true };

    if (type) {
      commerceQuery.commerceType = type;
    }

    if (search && search.trim()) {
      commerceQuery.name = { $regex: search.trim(), $options: 'i' };
    }

    const [commerceTypes, commerceRecords, favorites] = await Promise.all([
      CommerceType.find({ isActive: true }).sort('name').lean(),
      Commerce.find(commerceQuery)
        .populate({
          path: 'user',
          match: { role: 'commerce', isActive: true, isApproved: true },
          select: 'firstName lastName userName profileImage',
        })
        .populate('commerceType', 'name')
        .sort({ name: 1 })
        .lean(),
      Favorite.find({ client: req.session.userId }).lean(),
    ]);

    const favoriteIds = favorites.map((favorite) => favorite.commerce.toString());
    const commerces = commerceRecords
      .filter((commerce) => commerce.user)
      .map((commerce) => ({
        _id: commerce.user._id,
        commerceId: commerce._id,
        name: commerce.name,
        logo: commerce.logo,
        openingTime: commerce.openingTime,
        closingTime: commerce.closingTime,
        commerceType: commerce.commerceType,
        ownerName: `${commerce.user.firstName} ${commerce.user.lastName}`,
        profileImage: commerce.user.profileImage,
        isFavorite: favoriteIds.includes(commerce.user._id.toString()),
      }));

    res.render('client/commerces/list', {
      title: 'Comercios',
      commerces,
      commerceTypes: commerceTypes.map((commerceType) => ({
        ...commerceType,
        selected: type ? commerceType._id.toString() === type : false,
      })),
      selectedType: type || '',
      search: search || '',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar los comercios');
    res.redirect('/client/home');
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const { commerceId } = req.body;
    const commerce = await User.findOne({
      _id: commerceId,
      role: 'commerce',
      isActive: true,
      isApproved: true,
    }).lean();

    if (!commerce) {
      req.flash('error', 'Comercio no disponible.');
      return res.redirect(req.get('Referer') || '/client/commerces');
    }

    const existing = await Favorite.findOne({ client: req.session.userId, commerce: commerceId });
    if (!existing) {
      await Favorite.create({ client: req.session.userId, commerce: commerceId });
      req.flash('success', 'Comercio agregado a favoritos.');
    }

    res.redirect(req.get('Referer') || '/client/commerces');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al agregar el favorito');
    res.redirect('/client/commerces');
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const { commerceId } = req.body;
    await Favorite.deleteOne({ client: req.session.userId, commerce: commerceId });
    req.flash('success', 'Comercio eliminado de favoritos.');
    res.redirect(req.get('Referer') || '/client/favorites');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al eliminar el favorito');
    res.redirect('/client/favorites');
  }
};

exports.listFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ client: req.session.userId })
      .populate({
        path: 'commerce',
        match: { role: 'commerce', isActive: true, isApproved: true },
        select: 'firstName lastName',
      })
      .lean();

    const commerceIds = favorites
      .filter((favorite) => favorite.commerce)
      .map((favorite) => favorite.commerce._id);

    const commerceRecords = await Commerce.find({ user: { $in: commerceIds }, isActive: true })
      .populate('commerceType', 'name')
      .sort({ name: 1 })
      .lean();

    const commerces = commerceRecords.map((commerce) => {
      const favorite = favorites.find(
        (item) => item.commerce && item.commerce._id.toString() === commerce.user.toString()
      );

      return {
        _id: commerce.user,
        commerceId: commerce._id,
        name: commerce.name,
        logo: commerce.logo,
        openingTime: commerce.openingTime,
        closingTime: commerce.closingTime,
        commerceType: commerce.commerceType,
        ownerName: favorite ? `${favorite.commerce.firstName} ${favorite.commerce.lastName}` : '',
        isFavorite: true,
      };
    });

    res.render('client/favorites/list', {
      title: 'Mis Favoritos',
      commerces,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar tus favoritos');
    res.redirect('/client/home');
  }
};

exports.viewProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.query;

    const commerce = await Commerce.findOne({ user: id, isActive: true })
      .populate({
        path: 'user',
        match: { role: 'commerce', isActive: true, isApproved: true },
        select: 'firstName lastName',
      })
      .populate('commerceType', 'name')
      .lean();

    if (!commerce || !commerce.user) {
      req.flash('error', 'Comercio no disponible');
      return res.redirect('/client/commerces');
    }

    const categories = await Category.find({ commerce: id, isActive: true }).sort('name').lean();
    const validCategory = category
      ? categories.find((item) => item._id.toString() === category)
      : null;

    if (category && !validCategory) {
      req.flash('error', 'La categoria seleccionada no es valida');
      return res.redirect(`/client/commerces/${id}/products`);
    }

    const productFilter = { commerce: id, isActive: true };
    if (validCategory) productFilter.category = validCategory._id;

    const products = await Product.find(productFilter)
      .populate('category', 'name')
      .sort({ category: 1, name: 1 })
      .lean();

    const groupedProducts = categories
      .filter((currentCategory) => !validCategory || currentCategory._id.toString() === validCategory._id.toString())
      .map((currentCategory) => ({
        ...currentCategory,
        products: products.filter(
          (product) =>
            product.category &&
            product.category._id.toString() === currentCategory._id.toString()
        ),
      }))
      .filter((group) => group.products.length > 0);

    const categoriesWithSelection = categories.map((item) => ({
      ...item,
      selected: category ? item._id.toString() === category : false,
    }));

    res.render('client/products/list', {
      title: `Productos de ${commerce.name}`,
      commerce,
      groupedProducts,
      categories: categoriesWithSelection,
      selectedCategory: category || '',
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar los productos');
    res.redirect('/client/commerces');
  }
};
