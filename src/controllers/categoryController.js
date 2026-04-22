const Category = require('../models/Category');

const getCategoryByCommerce = (categoryId, commerceId) =>
  Category.findOne({ _id: categoryId, commerce: commerceId });

exports.getCategoriesByCommerce = async (req, res) => {
  try {
    const categories = await Category.find({ commerce: req.session.userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.render('commerce/categories/list', {
      title: 'Mis categorias',
      categories,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar las categorias');
    return res.redirect('/commerce/home');
  }
};

exports.getCreateCategoryForm = (req, res) => {
  return res.render('commerce/categories/create', {
    title: 'Nueva categoria',
  });
};

exports.createCategory = async (req, res) => {
  const { name } = req.body;
  const categoryName = name ? name.trim() : '';

  if (!categoryName) {
    req.flash('error', 'El nombre es obligatorio');
    req.flash('formData', JSON.stringify({ name }));
    return res.redirect('/commerce/categories/create');
  }

  try {
    await Category.create({
      name: categoryName,
      commerce: req.session.userId,
    });

    req.flash('success', 'Categoria creada correctamente');
    return res.redirect('/commerce/categories');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al crear la categoria');
    req.flash('formData', JSON.stringify({ name }));
    return res.redirect('/commerce/categories/create');
  }
};

exports.getEditCategoryForm = async (req, res) => {
  try {
    const category = await getCategoryByCommerce(req.params.id, req.session.userId);

    if (!category) {
      req.flash('error', 'Categoria no encontrada');
      return res.redirect('/commerce/categories');
    }

    return res.render('commerce/categories/edit', {
      title: 'Editar categoria',
      category: category.toObject(),
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cargar la categoria');
    return res.redirect('/commerce/categories');
  }
};

exports.updateCategory = async (req, res) => {
  const { name } = req.body;
  const categoryName = name ? name.trim() : '';

  if (!categoryName) {
    req.flash('error', 'El nombre es obligatorio');
    return res.redirect(`/commerce/categories/edit/${req.params.id}`);
  }

  try {
    const category = await getCategoryByCommerce(req.params.id, req.session.userId);

    if (!category) {
      req.flash('error', 'Categoria no encontrada');
      return res.redirect('/commerce/categories');
    }

    category.name = categoryName;
    await category.save();

    req.flash('success', 'Categoria actualizada correctamente');
    return res.redirect('/commerce/categories');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al actualizar la categoria');
    return res.redirect(`/commerce/categories/edit/${req.params.id}`);
  }
};

exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await getCategoryByCommerce(req.params.id, req.session.userId);

    if (!category) {
      req.flash('error', 'Categoria no encontrada');
      return res.redirect('/commerce/categories');
    }

    category.isActive = !category.isActive;
    await category.save();

    req.flash(
      'success',
      `Categoria ${category.isActive ? 'activada' : 'desactivada'} correctamente`
    );
    return res.redirect('/commerce/categories');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error al cambiar el estado de la categoria');
    return res.redirect('/commerce/categories');
  }
};

exports.list = exports.getCategoriesByCommerce;
exports.createForm = exports.getCreateCategoryForm;
exports.create = exports.createCategory;
exports.editForm = exports.getEditCategoryForm;
exports.update = exports.updateCategory;
exports.toggle = exports.toggleCategoryStatus;
