const Product = require('../models/Product');
const Category = require('../models/Category');

const getProductByCommerce = (productId, commerceId) =>
  Product.findOne({ _id: productId, commerce: commerceId });

const getActiveCategoriesByCommerce = (commerceId) =>
  Category.find({ commerce: commerceId, isActive: true }).sort('name').lean();

const getOwnedActiveCategory = (categoryId, commerceId) =>
  Category.findOne({ _id: categoryId, commerce: commerceId, isActive: true });

const mapCategoriesWithSelection = (categories, selectedCategoryId) =>
  categories.map((category) => ({
    ...category,
    selected: selectedCategoryId
      ? category._id.toString() === selectedCategoryId.toString()
      : false,
  }));

exports.getProductsByCommerce = async (req, res) => {
  try {
    const products = await Product.find({ commerce: req.session.userId })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return res.render('commerce/products/list', {
      title: 'Mis productos',
      products,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar los productos');
    return res.redirect('/commerce/home');
  }
};

exports.getCreateProductForm = async (req, res) => {
  try {
    const categories = await getActiveCategoriesByCommerce(req.session.userId);

    return res.render('commerce/products/create', {
      title: 'Nuevo producto',
      categories: mapCategoriesWithSelection(categories, res.locals.formData.category),
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar el formulario');
    return res.redirect('/commerce/products');
  }
};

exports.createProduct = async (req, res) => {
  const { name, description, price, stock, category } = req.body;
  const productName = name ? name.trim() : '';
  const productDescription = description ? description.trim() : '';
  const errors = [];

  if (!productName) errors.push('El nombre es obligatorio');
  if (!category) errors.push('La categoria es obligatoria');
  if (price === undefined || price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
    errors.push('El precio debe ser un numero valido');
  }
  if (stock === undefined || stock === '' || Number.isNaN(Number(stock)) || Number(stock) < 0) {
    errors.push('El stock debe ser un numero valido');
  }

  if (errors.length) {
    req.flash('error', errors.join(', '));
    req.flash('formData', JSON.stringify({ name, description, price, stock, category }));
    return res.redirect('/commerce/products/create');
  }

  try {
    const ownedCategory = await getOwnedActiveCategory(category, req.session.userId);

    if (!ownedCategory) {
      req.flash('error', 'La categoria seleccionada no es valida');
      req.flash('formData', JSON.stringify({ name, description, price, stock, category }));
      return res.redirect('/commerce/products/create');
    }

    await Product.create({
      name: productName,
      description: productDescription,
      price: Number(price),
      stock: Number(stock),
      category: ownedCategory._id,
      commerce: req.session.userId,
    });

    req.flash('success', 'Producto creado correctamente');
    return res.redirect('/commerce/products');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear el producto');
    req.flash('formData', JSON.stringify({ name, description, price, stock, category }));
    return res.redirect('/commerce/products/create');
  }
};

exports.getEditProductForm = async (req, res) => {
  try {
    const product = await getProductByCommerce(req.params.id, req.session.userId);

    if (!product) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/commerce/products');
    }

    const categories = await getActiveCategoriesByCommerce(req.session.userId);

    return res.render('commerce/products/edit', {
      title: 'Editar producto',
      product: product.toObject(),
      categories: mapCategoriesWithSelection(categories, product.category),
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar el producto');
    return res.redirect('/commerce/products');
  }
};

exports.updateProduct = async (req, res) => {
  const { name, description, price, stock, category } = req.body;
  const productName = name ? name.trim() : '';
  const productDescription = description ? description.trim() : '';
  const errors = [];

  if (!productName) errors.push('El nombre es obligatorio');
  if (!category) errors.push('La categoria es obligatoria');
  if (price === undefined || price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
    errors.push('El precio debe ser un numero valido');
  }
  if (stock === undefined || stock === '' || Number.isNaN(Number(stock)) || Number(stock) < 0) {
    errors.push('El stock debe ser un numero valido');
  }

  if (errors.length) {
    req.flash('error', errors.join(', '));
    return res.redirect(`/commerce/products/edit/${req.params.id}`);
  }

  try {
    const [product, ownedCategory] = await Promise.all([
      getProductByCommerce(req.params.id, req.session.userId),
      getOwnedActiveCategory(category, req.session.userId),
    ]);

    if (!product) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/commerce/products');
    }

    if (!ownedCategory) {
      req.flash('error', 'La categoria seleccionada no es valida');
      return res.redirect(`/commerce/products/edit/${req.params.id}`);
    }

    product.name = productName;
    product.description = productDescription;
    product.price = Number(price);
    product.stock = Number(stock);
    product.category = ownedCategory._id;
    await product.save();

    req.flash('success', 'Producto actualizado correctamente');
    return res.redirect('/commerce/products');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar el producto');
    return res.redirect(`/commerce/products/edit/${req.params.id}`);
  }
};

exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await getProductByCommerce(req.params.id, req.session.userId);

    if (!product) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/commerce/products');
    }

    product.isActive = !product.isActive;
    await product.save();

    req.flash(
      'success',
      `Producto ${product.isActive ? 'activado' : 'desactivado'} correctamente`
    );
    return res.redirect('/commerce/products');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cambiar el estado del producto');
    return res.redirect('/commerce/products');
  }
};

exports.list = exports.getProductsByCommerce;
exports.createForm = exports.getCreateProductForm;
exports.create = exports.createProduct;
exports.editForm = exports.getEditProductForm;
exports.update = exports.updateProduct;
exports.toggle = exports.toggleProductStatus;
