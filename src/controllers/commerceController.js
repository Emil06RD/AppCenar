const User = require('../models/User');
const Commerce = require('../models/Commerce');
const CommerceType = require('../models/CommerceType');

exports.home = async (req, res) => {
  try {
    const commerce = await Commerce.findOne({ user: req.session.userId })
      .populate('commerceType', 'name')
      .lean();

    res.render('commerce/home', {
      title: 'Mi comercio',
      commerce,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el panel del comercio');
    res.render('commerce/home', { title: 'Mi comercio' });
  }
};

exports.profileForm = async (req, res) => {
  try {
    const [user, commerce, commerceTypes] = await Promise.all([
      User.findOne({ _id: req.session.userId, role: 'commerce' }).lean(),
      Commerce.findOne({ user: req.session.userId }).lean(),
      CommerceType.find().sort({ name: 1 }).lean(),
    ]);

    if (!user || !commerce) {
      req.flash('error', 'Comercio no encontrado');
      return res.redirect('/commerce/home');
    }

    const selectedCommerceType = res.locals.formData.commerceType || commerce.commerceType?.toString();

    res.render('commerce/profile/edit', {
      title: 'Editar comercio',
      profile: {
        ...user,
        commerceName: commerce.name,
        commerceType: selectedCommerceType,
        openingTime: commerce.openingTime,
        closingTime: commerce.closingTime,
        ...res.locals.formData,
      },
      commerceTypes: commerceTypes.map((commerceType) => ({
        ...commerceType,
        selected: commerceType._id.toString() === selectedCommerceType,
      })),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el perfil del comercio');
    res.redirect('/commerce/home');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const [user, commerce] = await Promise.all([
      User.findOne({ _id: req.session.userId, role: 'commerce' }),
      Commerce.findOne({ user: req.session.userId }),
    ]);

    if (!user || !commerce) {
      req.flash('error', 'Comercio no encontrado');
      return res.redirect('/commerce/home');
    }

    const {
      firstName,
      lastName,
      userName,
      email,
      phone,
      commerceName,
      commerceType,
      openingTime,
      closingTime,
    } = req.body;

    const normalizedUserName = userName.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    const [existingUserName, existingEmail, validCommerceType] = await Promise.all([
      User.findOne({ _id: { $ne: user._id }, userName: normalizedUserName }).lean(),
      User.findOne({ _id: { $ne: user._id }, email: normalizedEmail }).lean(),
      CommerceType.findById(commerceType).lean(),
    ]);

    if (existingUserName) {
      req.flash('error', 'Ese nombre de usuario ya esta en uso');
      return res.redirect('/commerce/profile');
    }

    if (existingEmail) {
      req.flash('error', 'Ya existe una cuenta con ese email');
      return res.redirect('/commerce/profile');
    }

    if (!validCommerceType) {
      req.flash('error', 'El tipo de comercio seleccionado no es valido');
      return res.redirect('/commerce/profile');
    }

    user.firstName = firstName.trim();
    user.lastName = lastName.trim();
    user.userName = normalizedUserName;
    user.email = normalizedEmail;
    user.phone = phone.trim();

    commerce.name = commerceName.trim();
    commerce.commerceType = validCommerceType._id;
    commerce.openingTime = openingTime.trim();
    commerce.closingTime = closingTime.trim();

    await Promise.all([user.save(), commerce.save()]);

    req.session.userName = user.userName;
    req.flash('success', 'Perfil del comercio actualizado correctamente');
    res.redirect('/commerce/profile');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar el comercio');
    res.redirect('/commerce/profile');
  }
};
