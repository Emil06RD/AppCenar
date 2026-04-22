const CommerceType = require('../models/CommerceType');

exports.list = async (req, res) => {
  try {
    const commerceTypes = await CommerceType.find().sort({ name: 1 }).lean();

    res.render('admin/commerce-types/list', {
      title: 'Tipos de Comercio',
      commerceTypes,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'No se pudieron cargar los tipos de comercio.');
    res.redirect('/admin');
  }
};

exports.createForm = (req, res) => {
  res.render('admin/commerce-types/create', {
    title: 'Nuevo Tipo de Comercio',
    commerceType: {
      name: '',
      description: '',
      isActive: true,
    },
  });
};

exports.create = async (req, res) => {
  const { name, description, isActive } = req.body;

  if (!name || !name.trim()) {
    req.flash('error', 'El nombre es obligatorio.');
    return res.render('admin/commerce-types/create', {
      title: 'Nuevo Tipo de Comercio',
      commerceType: {
        name: name || '',
        description: description || '',
        isActive: isActive === 'on',
      },
    });
  }

  try {
    const existingType = await CommerceType.findOne({ name: name.trim() }).lean();
    if (existingType) {
      req.flash('error', 'Ya existe un tipo de comercio con ese nombre.');
      return res.render('admin/commerce-types/create', {
        title: 'Nuevo Tipo de Comercio',
        commerceType: {
          name: name,
          description: description || '',
          isActive: isActive === 'on',
        },
      });
    }

    await CommerceType.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      isActive: isActive === 'on',
    });

    req.flash('success', 'Tipo de comercio creado correctamente.');
    res.redirect('/admin/commerce-types');
  } catch (error) {
    console.error(error);
    req.flash('error', 'No se pudo crear el tipo de comercio.');
    res.redirect('/admin/commerce-types/create');
  }
};

exports.editForm = async (req, res) => {
  try {
    const commerceType = await CommerceType.findById(req.params.id).lean();

    if (!commerceType) {
      req.flash('error', 'Tipo de comercio no encontrado.');
      return res.redirect('/admin/commerce-types');
    }

    res.render('admin/commerce-types/edit', {
      title: 'Editar Tipo de Comercio',
      commerceType,
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'No se pudo cargar el tipo de comercio.');
    res.redirect('/admin/commerce-types');
  }
};

exports.update = async (req, res) => {
  const { name, description, isActive } = req.body;

  if (!name || !name.trim()) {
    req.flash('error', 'El nombre es obligatorio.');
    return res.redirect(`/admin/commerce-types/${req.params.id}/edit`);
  }

  try {
    const commerceType = await CommerceType.findById(req.params.id);

    if (!commerceType) {
      req.flash('error', 'Tipo de comercio no encontrado.');
      return res.redirect('/admin/commerce-types');
    }

    const duplicate = await CommerceType.findOne({
      _id: { $ne: req.params.id },
      name: name.trim(),
    }).lean();

    if (duplicate) {
      req.flash('error', 'Ya existe otro tipo de comercio con ese nombre.');
      return res.redirect(`/admin/commerce-types/${req.params.id}/edit`);
    }

    commerceType.name = name.trim();
    commerceType.description = description ? description.trim() : '';
    commerceType.isActive = isActive === 'on';

    await commerceType.save();

    req.flash('success', 'Tipo de comercio actualizado correctamente.');
    res.redirect('/admin/commerce-types');
  } catch (error) {
    console.error(error);
    req.flash('error', 'No se pudo actualizar el tipo de comercio.');
    res.redirect(`/admin/commerce-types/${req.params.id}/edit`);
  }
};

exports.remove = async (req, res) => {
  try {
    const commerceType = await CommerceType.findById(req.params.id);

    if (!commerceType) {
      req.flash('error', 'Tipo de comercio no encontrado.');
      return res.redirect('/admin/commerce-types');
    }

    await commerceType.deleteOne();

    req.flash('success', 'Tipo de comercio eliminado correctamente.');
    res.redirect('/admin/commerce-types');
  } catch (error) {
    console.error(error);
    req.flash('error', 'No se pudo eliminar el tipo de comercio.');
    res.redirect('/admin/commerce-types');
  }
};
