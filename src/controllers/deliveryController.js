const User = require('../models/User');
const Order = require('../models/Order');

exports.home = async (req, res) => {
  try {
    const activeOrder = await Order.findOne({
      delivery: req.session.userId,
      status: 'in_process',
    })
      .populate('client', 'firstName lastName')
      .lean();

    const user = await User.findOne({ _id: req.session.userId, role: 'delivery' }).lean();

    res.render('delivery/home', {
      title: 'Mis entregas',
      delivery: user,
      activeOrder,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el panel del delivery');
    res.render('delivery/home', { title: 'Mis entregas' });
  }
};

exports.profileForm = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId, role: 'delivery' }).lean();
    if (!user) {
      req.flash('error', 'Repartidor no encontrado');
      return res.redirect('/delivery/home');
    }

    res.render('delivery/profile/edit', {
      title: 'Mi perfil',
      profile: {
        ...user,
        ...res.locals.formData,
      },
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el perfil');
    res.redirect('/delivery/home');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId, role: 'delivery' });
    if (!user) {
      req.flash('error', 'Repartidor no encontrado');
      return res.redirect('/delivery/home');
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
      return res.redirect('/delivery/profile');
    }

    if (existingEmail) {
      req.flash('error', 'Ya existe una cuenta con ese email');
      return res.redirect('/delivery/profile');
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.userName = normalizedUserName;
    user.email = normalizedEmail;
    user.phone = phone.trim();
    await user.save();

    req.session.userName = user.userName;
    req.flash('success', 'Perfil actualizado correctamente');
    res.redirect('/delivery/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar el perfil');
    res.redirect('/delivery/profile');
  }
};

exports.toggleAvailability = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.session.userId, role: 'delivery' });
    if (!user) {
      req.flash('error', 'Repartidor no encontrado');
      return res.redirect('/delivery/home');
    }

    const activeOrder = await Order.exists({ delivery: user._id, status: 'in_process' });
    if (activeOrder) {
      req.flash('error', 'No puedes cambiar tu disponibilidad mientras tienes un pedido en proceso');
      return res.redirect('/delivery/home');
    }

    user.isAvailable = !user.isAvailable;
    await user.save();

    req.flash('success', `Disponibilidad ${user.isAvailable ? 'activada' : 'desactivada'} correctamente`);
    res.redirect('/delivery/home');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cambiar la disponibilidad');
    res.redirect('/delivery/home');
  }
};
