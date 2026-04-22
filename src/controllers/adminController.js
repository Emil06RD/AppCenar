const bcrypt        = require('bcrypt');
const User          = require('../models/User');
const Commerce      = require('../models/Commerce');
const CommerceType  = require('../models/CommerceType');
const Order         = require('../models/Order');
const Configuration = require('../models/Configuration');

async function syncCommerceState(user) {
  if (user.role !== 'commerce') return;

  await Commerce.findOneAndUpdate(
    { user: user._id },
    { isActive: Boolean(user.isActive && user.isApproved) }
  );
}

// ── GET /admin ─────────────────────────────────────────────────────────────────
exports.dashboard = async (req, res) => {
  try {
    const [totalUsers, totalCommerces, totalOrders, pendingCommerces] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'commerce' }),
      Order.countDocuments(),
      User.countDocuments({ role: 'commerce', isApproved: false, isActive: true }),
    ]);

    res.render('admin/dashboard', {
      title: 'Panel de Administración',
      stats: { totalUsers, totalCommerces, totalOrders, pendingCommerces },
    });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', { title: 'Panel de Administración', stats: {} });
  }
};

// ── GET /admin/users?role=<role> ───────────────────────────────────────────────
exports.listUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).sort({ createdAt: -1 }).lean();
    res.render('admin/users/list', {
      title: 'Usuarios',
      users: users.map((user) => ({
        ...user,
        isCommerce: user.role === 'commerce',
      })),
      selectedRole: role || '',
      roleFilters: {
        client: role === 'client',
        commerce: role === 'commerce',
        delivery: role === 'delivery',
        admin: role === 'admin',
      },
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar los usuarios');
    res.redirect('/admin');
  }
};

// ── POST /admin/users/:id/toggle ───────────────────────────────────────────────
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/admin/users');
    }

    if (user.role === 'admin' && user._id.toString() === req.session.userId) {
      req.flash('error', 'No puedes desactivar tu propia cuenta de administrador');
      return res.redirect('/admin/users');
    }

    user.isActive = !user.isActive;
    if (user.role === 'delivery' && !user.isActive) {
      user.isAvailable = false;
    }
    await user.save();
    await syncCommerceState(user);
    req.flash('success', `Usuario ${user.isActive ? 'activado' : 'desactivado'}`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cambiar estado del usuario');
    res.redirect('/admin/users');
  }
};

// ── POST /admin/users/:id/approve ─────────────────────────────────────────────
exports.approveCommerce = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'commerce' });
    if (!user) {
      req.flash('error', 'Comercio no encontrado');
      return res.redirect('/admin/users');
    }
    user.isApproved = !user.isApproved;
    await user.save();
    await syncCommerceState(user);
    req.flash('success', `Comercio ${user.isApproved ? 'aprobado' : 'rechazado'}`);
    res.redirect('/admin/users');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar el comercio');
    res.redirect('/admin/users');
  }
};

// ── GET /admin/commerce-types ─────────────────────────────────────────────────
exports.listCommerceTypes = async (req, res) => {
  try {
    const types = await CommerceType.find().sort({ name: 1 }).lean();
    res.render('admin/commerce-types/list', { title: 'Tipos de Comercio', types });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar tipos de comercio');
    res.redirect('/admin');
  }
};

// ── GET /admin/commerce-types/create ─────────────────────────────────────────
exports.createTypeForm = (req, res) => {
  res.render('admin/commerce-types/create', { title: 'Nuevo Tipo de Comercio' });
};

// ── POST /admin/commerce-types/create ────────────────────────────────────────
exports.createType = async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name || name.trim() === '') {
    req.flash('error', 'El nombre es obligatorio');
    return res.redirect('/admin/commerce-types/create');
  }
  try {
    await CommerceType.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      icon: icon ? icon.trim() : 'bi-shop',
      isActive: true,
    });
    req.flash('success', 'Tipo de comercio creado');
    res.redirect('/admin/commerce-types');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al crear el tipo de comercio');
    res.redirect('/admin/commerce-types/create');
  }
};

// ── GET /admin/commerce-types/:id/edit ───────────────────────────────────────
exports.editTypeForm = async (req, res) => {
  try {
    const type = await CommerceType.findById(req.params.id).lean();
    if (!type) {
      req.flash('error', 'Tipo no encontrado');
      return res.redirect('/admin/commerce-types');
    }
    res.render('admin/commerce-types/edit', { title: 'Editar Tipo de Comercio', type });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el tipo');
    res.redirect('/admin/commerce-types');
  }
};

// ── POST /admin/commerce-types/:id/edit ──────────────────────────────────────
exports.updateType = async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name || name.trim() === '') {
    req.flash('error', 'El nombre es obligatorio');
    return res.redirect(`/admin/commerce-types/${req.params.id}/edit`);
  }
  try {
    await CommerceType.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      description: description ? description.trim() : '',
      icon: icon ? icon.trim() : 'bi-shop',
    });
    req.flash('success', 'Tipo de comercio actualizado');
    res.redirect('/admin/commerce-types');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar el tipo');
    res.redirect(`/admin/commerce-types/${req.params.id}/edit`);
  }
};

// ── POST /admin/commerce-types/:id/toggle ────────────────────────────────────
exports.toggleType = async (req, res) => {
  try {
    const type = await CommerceType.findById(req.params.id);
    if (!type) {
      req.flash('error', 'Tipo no encontrado');
      return res.redirect('/admin/commerce-types');
    }
    type.isActive = !type.isActive;
    await type.save();
    req.flash('success', `Tipo ${type.isActive ? 'activado' : 'desactivado'}`);
    res.redirect('/admin/commerce-types');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cambiar estado');
    res.redirect('/admin/commerce-types');
  }
};

// ── GET /admin/configuration ──────────────────────────────────────────────────
exports.configForm = async (req, res) => {
  try {
    let config = await Configuration.findOne().lean();
    if (!config) config = { itbis: 18 };
    res.render('admin/configuration', { title: 'Configuración', config });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar la configuración');
    res.redirect('/admin');
  }
};

// ── POST /admin/configuration ─────────────────────────────────────────────────
exports.updateConfig = async (req, res) => {
  const { itbis } = req.body;
  if (itbis === undefined || isNaN(itbis) || +itbis < 0 || +itbis > 100) {
    req.flash('error', 'El ITBIS debe ser un número entre 0 y 100');
    return res.redirect('/admin/configuration');
  }
  try {
    await Configuration.findOneAndUpdate({}, { itbis: +itbis }, { upsert: true, new: true });
    req.flash('success', `ITBIS actualizado a ${itbis}%`);
    res.redirect('/admin/configuration');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al guardar la configuración');
    res.redirect('/admin/configuration');
  }
};

exports.listAdministrators = async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).sort({ createdAt: -1 }).lean();
    res.render('admin/administrators/list', {
      title: 'Administradores',
      admins: admins.map((admin) => ({
        ...admin,
        isCurrent: admin._id.toString() === req.session.userId,
      })),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar los administradores');
    res.redirect('/admin');
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
    const { firstName, lastName, userName, email, phone, password } = req.body;
    const normalizedUserName = userName.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const [existingUserName, existingEmail] = await Promise.all([
      User.findOne({ userName: normalizedUserName }).lean(),
      User.findOne({ email: normalizedEmail }).lean(),
    ]);

    if (existingUserName) {
      req.flash('error', 'Ese nombre de usuario ya esta en uso');
      return res.redirect('/admin/administrators/create');
    }

    if (existingEmail) {
      req.flash('error', 'Ya existe una cuenta con ese email');
      return res.redirect('/admin/administrators/create');
    }

    await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      userName: normalizedUserName,
      email: normalizedEmail,
      phone: phone.trim(),
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      isActive: true,
    });

    req.flash('success', 'Administrador creado correctamente');
    res.redirect('/admin/administrators');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al crear el administrador');
    res.redirect('/admin/administrators/create');
  }
};

exports.editAdministratorForm = async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' }).lean();
    if (!admin) {
      req.flash('error', 'Administrador no encontrado');
      return res.redirect('/admin/administrators');
    }

    res.render('admin/administrators/edit', {
      title: 'Editar administrador',
      admin: {
        ...admin,
        ...res.locals.formData,
      },
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el administrador');
    res.redirect('/admin/administrators');
  }
};

exports.updateAdministrator = async (req, res) => {
  try {
    const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
    if (!admin) {
      req.flash('error', 'Administrador no encontrado');
      return res.redirect('/admin/administrators');
    }

    const { firstName, lastName, userName, email, phone, password } = req.body;
    const normalizedUserName = userName.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const [existingUserName, existingEmail] = await Promise.all([
      User.findOne({ _id: { $ne: admin._id }, userName: normalizedUserName }).lean(),
      User.findOne({ _id: { $ne: admin._id }, email: normalizedEmail }).lean(),
    ]);

    if (existingUserName) {
      req.flash('error', 'Ese nombre de usuario ya esta en uso');
      return res.redirect(`/admin/administrators/${req.params.id}/edit`);
    }

    if (existingEmail) {
      req.flash('error', 'Ya existe una cuenta con ese email');
      return res.redirect(`/admin/administrators/${req.params.id}/edit`);
    }

    admin.firstName = firstName.trim();
    admin.lastName = lastName.trim();
    admin.userName = normalizedUserName;
    admin.email = normalizedEmail;
    admin.phone = phone.trim();

    if (password) {
      admin.password = await bcrypt.hash(password, 10);
    }

    await admin.save();

    req.flash('success', 'Administrador actualizado correctamente');
    res.redirect('/admin/administrators');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar el administrador');
    res.redirect(`/admin/administrators/${req.params.id}/edit`);
  }
};

exports.deleteAdministrator = async (req, res) => {
  try {
    if (req.params.id === req.session.userId) {
      req.flash('error', 'No puedes eliminar tu propia cuenta de administrador');
      return res.redirect('/admin/administrators');
    }

    const admin = await User.findOneAndDelete({ _id: req.params.id, role: 'admin' });
    if (!admin) {
      req.flash('error', 'Administrador no encontrado');
      return res.redirect('/admin/administrators');
    }

    req.flash('success', 'Administrador eliminado correctamente');
    res.redirect('/admin/administrators');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al eliminar el administrador');
    res.redirect('/admin/administrators');
  }
};
