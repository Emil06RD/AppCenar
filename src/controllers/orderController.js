const Order         = require('../models/Order');
const Product       = require('../models/Product');
const Address       = require('../models/Address');
const User          = require('../models/User');
const Configuration = require('../models/Configuration');

// ══════════════════════════════════════════════════════════════
//  CLIENT
// ══════════════════════════════════════════════════════════════

// ── GET /client/orders ────────────────────────────────────────
exports.clientHistory = async (req, res) => {
  try {
    const orders = await Order.find({ client: req.session.userId })
      .populate('commerce', 'firstName lastName userName')
      .populate('products.product', 'name')
      .populate('address')
      .sort({ createdAt: -1 });

    res.render('client/orders/history', {
      title: 'Mis pedidos',
      orders: orders.map(formatOrderForView),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar los pedidos');
    res.redirect('/client/home');
  }
};

// ── GET /client/orders/create?commerce=<id> ───────────────────
exports.createForm = async (req, res) => {
  try {
    const commerceId = req.query.commerce;
    if (!commerceId) return res.redirect('/client/home');

    const commerceRecord = await require('../models/Commerce')
      .findOne({ user: commerceId, isActive: true })
      .populate({
        path: 'user',
        match: { role: 'commerce', isActive: true, isApproved: true },
        select: 'firstName lastName',
      })
      .lean();

    const commerce = commerceRecord && commerceRecord.user
      ? {
          _id: commerceRecord.user._id,
          name: commerceRecord.name,
          openingTime: commerceRecord.openingTime,
          closingTime: commerceRecord.closingTime,
        }
      : null;

    if (!commerce) {
      req.flash('error', 'Comercio no disponible');
      return res.redirect('/client/home');
    }

    const products = await Product.find({ commerce: commerceId, isActive: true, stock: { $gt: 0 } })
      .populate('category', 'name');

    const addresses = await Address.find({ client: req.session.userId }).sort({ isDefault: -1, createdAt: -1 });
    const config = await Configuration.findOne().lean() || { itbis: 18 };

    res.render('client/orders/create', {
      title: 'Nuevo pedido',
      commerce,
      products: products.map(p => p.toObject()),
      addresses: addresses.map(a => a.toObject()),
      itbisPercent: config.itbis,
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el formulario de pedido');
    res.redirect('/client/home');
  }
};

// ── POST /client/orders ───────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { commerceId, addressId, quantities } = req.body;
    // quantities = { "<productId>": "2", "<productId>": "1" ... }

    if (!commerceId || !addressId) {
      req.flash('error', 'Falta el comercio o la dirección');
      return res.redirect('/client/home');
    }

    const address = await Address.findOne({ _id: addressId, client: req.session.userId });
    if (!address) {
      req.flash('error', 'Dirección no válida');
      return res.redirect(`/client/orders/create?commerce=${commerceId}`);
    }

    // Construir líneas del pedido
    const lines = [];
    if (quantities && typeof quantities === 'object') {
      for (const [productId, qty] of Object.entries(quantities)) {
        const quantity = parseInt(qty, 10);
        if (!quantity || quantity < 1) continue;

        const product = await Product.findOne({ _id: productId, commerce: commerceId, isActive: true });
        if (!product) continue;

        if (product.stock < quantity) {
          req.flash('error', `Stock insuficiente para: ${product.name}`);
          return res.redirect(`/client/orders/create?commerce=${commerceId}`);
        }

        lines.push({ product: product._id, quantity, unitPrice: product.price });
      }
    }

    if (lines.length === 0) {
      req.flash('error', 'El pedido no puede estar vacío');
      return res.redirect(`/client/orders/create?commerce=${commerceId}`);
    }

    // Calcular totales
    const config = await Configuration.findOne() || { itbis: 18 };
    const subtotal = +lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0).toFixed(2);
    const itbisAmt = +(subtotal * (config.itbis / 100)).toFixed(2);
    const total = +(subtotal + itbisAmt).toFixed(2);

    // Descontar stock
    for (const line of lines) {
      await Product.findByIdAndUpdate(line.product, { $inc: { stock: -line.quantity } });
    }

    await Order.create({
      client:   req.session.userId,
      commerce: commerceId,
      products: lines,
      subtotal,
      itbis:    itbisAmt,
      total,
      address:  addressId,
      status:   'pending',
    });

    req.flash('success', 'Pedido creado correctamente');
    res.redirect('/client/orders');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al crear el pedido');
    res.redirect('/client/home');
  }
};

exports.clientDetail = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, client: req.session.userId })
      .populate('commerce', 'firstName lastName userName')
      .populate('delivery', 'firstName lastName phone')
      .populate('products.product', 'name')
      .populate('address');

    if (!order) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/client/orders');
    }

    res.render('client/orders/detail', {
      title: 'Detalle del pedido',
      order: formatOrderForView(order),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el pedido');
    res.redirect('/client/orders');
  }
};

// ══════════════════════════════════════════════════════════════
//  COMMERCE
// ══════════════════════════════════════════════════════════════

// ── GET /commerce/orders ──────────────────────────────────────
exports.commerceOrders = async (req, res) => {
  try {
    const orders = await Order.find({ commerce: req.session.userId, status: 'pending' })
      .populate('client',  'firstName lastName')
      .populate('delivery','firstName lastName')
      .populate('products.product', 'name')
      .populate('address')
      .sort({ createdAt: -1 });

    res.render('commerce/orders/list', {
      title: 'Pedidos recibidos',
      orders: orders.map((order) => ({
        ...formatOrderForView(order),
        isPending: order.status === 'pending',
      })),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar los pedidos');
    res.redirect('/commerce/home');
  }
};

exports.commerceOrderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, commerce: req.session.userId })
      .populate('client', 'firstName lastName phone email')
      .populate('delivery', 'firstName lastName phone')
      .populate('products.product', 'name')
      .populate('address');

    if (!order) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/commerce/orders');
    }

    res.render('commerce/orders/detail', {
      title: 'Detalle del pedido',
      order: {
        ...formatOrderForView(order),
        isPending: order.status === 'pending',
      },
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el pedido');
    res.redirect('/commerce/orders');
  }
};

// ── POST /commerce/orders/:id/process ────────────────────────
// Commerce acepta el pedido y asigna un delivery disponible
exports.processOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, commerce: req.session.userId, status: 'pending' });
    if (!order) {
      req.flash('error', 'Pedido no encontrado o ya procesado');
      return res.redirect('/commerce/orders');
    }

    const busyDeliveryIds = await Order.find({ status: 'in_process', delivery: { $ne: null } })
      .distinct('delivery');

    const deliveryUser = await User.findOne({
      role: 'delivery',
      isActive: true,
      isAvailable: true,
      _id: { $nin: busyDeliveryIds },
    });

    if (!deliveryUser) {
      req.flash('error', 'No hay repartidores disponibles para asignar este pedido.');
      return res.redirect('/commerce/orders');
    }

    order.status = 'in_process';
    order.delivery = deliveryUser._id;
    deliveryUser.isAvailable = false;

    await Promise.all([
      order.save(),
      deliveryUser.save(),
    ]);

    req.flash('success', `Pedido en proceso. Delivery asignado: ${deliveryUser.firstName}`);
    res.redirect('/commerce/orders');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al procesar el pedido');
    res.redirect('/commerce/orders');
  }
};

// ══════════════════════════════════════════════════════════════
//  DELIVERY
// ══════════════════════════════════════════════════════════════

// ── GET /delivery/orders ──────────────────────────────────────
exports.deliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({ delivery: req.session.userId, status: 'in_process' })
      .populate('client',  'firstName lastName phone')
      .populate('commerce', 'firstName lastName')
      .populate('products.product', 'name')
      .populate('address')
      .sort({ createdAt: -1 });

    res.render('delivery/orders/list', {
      title: 'Mis entregas',
      orders: orders.map(formatOrderForView),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar los pedidos');
    res.redirect('/delivery/home');
  }
};

exports.deliveryOrderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, delivery: req.session.userId })
      .populate('client', 'firstName lastName phone')
      .populate('commerce', 'firstName lastName userName')
      .populate('products.product', 'name')
      .populate('address');

    if (!order) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/delivery/orders');
    }

    res.render('delivery/orders/detail', {
      title: 'Detalle del pedido',
      order: {
        ...formatOrderForView(order),
        hideAddress: order.status === 'completed',
        isInProcess: order.status === 'in_process',
      },
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el pedido');
    res.redirect('/delivery/orders');
  }
};

// ── POST /delivery/orders/:id/complete ───────────────────────
exports.completeOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, delivery: req.session.userId, status: 'in_process' });
    if (!order) {
      req.flash('error', 'Pedido no encontrado');
      return res.redirect('/delivery/orders');
    }

    const deliveryUser = await User.findOne({
      _id: req.session.userId,
      role: 'delivery',
      isActive: true,
    });

    if (!deliveryUser) {
      req.flash('error', 'Repartidor no disponible');
      return res.redirect('/delivery/orders');
    }

    order.status = 'completed';
    deliveryUser.isAvailable = true;

    await Promise.all([
      order.save(),
      deliveryUser.save(),
    ]);

    req.flash('success', 'Pedido marcado como completado');
    res.redirect('/delivery/orders');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al completar el pedido');
    res.redirect('/delivery/orders');
  }
};

// ── Helpers ───────────────────────────────────────────────────
function statusLabel(status) {
  const labels = { pending: 'Pendiente', in_process: 'En proceso', completed: 'Completado', cancelled: 'Cancelado' };
  return labels[status] || status;
}

function formatOrderForView(order) {
  const raw = order.toObject ? order.toObject() : order;

  return {
    ...raw,
    statusLabel: statusLabel(raw.status),
    createdAtLabel: raw.createdAt
      ? new Date(raw.createdAt).toLocaleString('es-DO')
      : '',
  };
}
