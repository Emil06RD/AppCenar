const Address = require('../models/Address');

// ── GET /client/addresses ─────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const addresses = await Address.find({ client: req.session.userId }).sort({ isDefault: -1, createdAt: -1 });
    res.render('client/addresses/list', {
      title: 'Mis direcciones',
      addresses: addresses.map(a => a.toObject()),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar las direcciones');
    res.redirect('/client/home');
  }
};

// ── GET /client/addresses/create ──────────────────────────────────────────────
exports.createForm = (req, res) => {
  res.render('client/addresses/create', { title: 'Nueva dirección' });
};

// ── POST /client/addresses/create ─────────────────────────────────────────────
exports.create = async (req, res) => {
  const { street, city, reference, isDefault } = req.body;
  const errors = [];
  if (!street || street.trim() === '') errors.push('La calle es obligatoria');
  if (!city   || city.trim()   === '') errors.push('La ciudad es obligatoria');

  if (errors.length) {
    req.flash('error', errors.join(', '));
    return res.redirect('/client/addresses/create');
  }

  try {
    // Si marca como predeterminada, quitar la actual
    if (isDefault) {
      await Address.updateMany({ client: req.session.userId }, { isDefault: false });
    }
    await Address.create({
      client:    req.session.userId,
      street:    street.trim(),
      city:      city.trim(),
      reference: reference ? reference.trim() : '',
      isDefault: !!isDefault,
    });
    req.flash('success', 'Dirección creada correctamente');
    res.redirect('/client/addresses');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al crear la dirección');
    res.redirect('/client/addresses/create');
  }
};

// ── GET /client/addresses/:id/edit ────────────────────────────────────────────
exports.editForm = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, client: req.session.userId });
    if (!address) {
      req.flash('error', 'Dirección no encontrada');
      return res.redirect('/client/addresses');
    }
    res.render('client/addresses/edit', { title: 'Editar dirección', address: address.toObject() });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar la dirección');
    res.redirect('/client/addresses');
  }
};

// ── POST /client/addresses/:id/edit ───────────────────────────────────────────
exports.update = async (req, res) => {
  const { street, city, reference, isDefault } = req.body;
  const errors = [];
  if (!street || street.trim() === '') errors.push('La calle es obligatoria');
  if (!city   || city.trim()   === '') errors.push('La ciudad es obligatoria');

  if (errors.length) {
    req.flash('error', errors.join(', '));
    return res.redirect(`/client/addresses/${req.params.id}/edit`);
  }

  try {
    const address = await Address.findOne({ _id: req.params.id, client: req.session.userId });
    if (!address) {
      req.flash('error', 'Dirección no encontrada');
      return res.redirect('/client/addresses');
    }
    if (isDefault) {
      await Address.updateMany({ client: req.session.userId }, { isDefault: false });
    }
    address.street    = street.trim();
    address.city      = city.trim();
    address.reference = reference ? reference.trim() : '';
    address.isDefault = !!isDefault;
    await address.save();
    req.flash('success', 'Dirección actualizada correctamente');
    res.redirect('/client/addresses');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar la dirección');
    res.redirect(`/client/addresses/${req.params.id}/edit`);
  }
};

// ── POST /client/addresses/:id/delete ─────────────────────────────────────────
exports.destroy = async (req, res) => {
  try {
    await Address.deleteOne({ _id: req.params.id, client: req.session.userId });
    req.flash('success', 'Dirección eliminada');
    res.redirect('/client/addresses');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al eliminar la dirección');
    res.redirect('/client/addresses');
  }
};

// ── POST /client/addresses/:id/default ────────────────────────────────────────
exports.setDefault = async (req, res) => {
  try {
    await Address.updateMany({ client: req.session.userId }, { isDefault: false });
    await Address.findOneAndUpdate(
      { _id: req.params.id, client: req.session.userId },
      { isDefault: true }
    );
    req.flash('success', 'Dirección predeterminada actualizada');
    res.redirect('/client/addresses');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al actualizar la dirección predeterminada');
    res.redirect('/client/addresses');
  }
};
