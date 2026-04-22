const { apiRequestWithSession } = require('../services/api');
const { handleApiPageError, getApiErrorMessage } = require('../utils/apiController');

function statusLabel(status) {
  const labels = {
    Pending: 'Pendiente',
    InProgress: 'En proceso',
    Completed: 'Completado',
    Cancelled: 'Cancelado',
  };

  return labels[status] || status;
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('es-DO');
}

function mapOrder(order = {}) {
  return {
    _id: order.id || order._id,
    status: order.status,
    statusLabel: statusLabel(order.status),
    createdAt: order.createdAt,
    createdAtLabel: formatDate(order.createdAt),
    subtotal: order.subtotal,
    itbis: order.itbisAmount,
    itbisPercentage: order.itbisPercentage,
    total: order.total,
    client: order.client || null,
    commerce: order.commerce || null,
    delivery: order.delivery || null,
    address: order.address || null,
    products: (order.items || []).map((item) => ({
      _id: item.id || item._id,
      product: {
        _id: item.productId,
        name: item.productName,
      },
      quantity: item.quantity,
      unitPrice: item.productPrice,
      lineTotal: item.lineTotal,
    })),
  };
}

function mapCatalogProducts(catalog = {}) {
  return (catalog.categories || []).flatMap((category) =>
    (category.products || []).map((product) => ({
      _id: product.id || product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: {
        _id: category.id || category._id,
        name: category.name,
      },
    }))
  );
}

exports.clientHistory = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/orders/my-orders');

    res.render('client/orders/history', {
      title: 'Mis pedidos',
      orders: (response.data || []).map(mapOrder),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar los pedidos.', '/client/home');
  }
};

exports.createForm = async (req, res) => {
  const commerceId = req.query.commerce;

  if (!commerceId) {
    req.flash('error', 'Debes seleccionar un comercio para hacer un pedido.');
    return res.redirect('/client/commerces');
  }

  try {
    const [catalogResponse, addressesResponse] = await Promise.all([
      apiRequestWithSession(req, `/commerce/${commerceId}/catalog`),
      apiRequestWithSession(req, '/addresses'),
    ]);

    const catalog = catalogResponse.data;
    const addresses = (addressesResponse.data || []).map((address) => ({
      _id: address.id || address._id,
      label: address.label,
      street: address.street,
      sector: address.sector,
      city: address.city,
      reference: address.reference,
    }));

    res.render('client/orders/create', {
      title: 'Nuevo pedido',
      commerce: {
        _id: catalog.commerce.id || catalog.commerce._id,
        name: catalog.commerce.name,
      },
      products: mapCatalogProducts(catalog),
      addresses,
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el formulario del pedido.', '/client/commerces');
  }
};

exports.create = async (req, res) => {
  const quantities = req.body.quantities || {};
  const items = Object.entries(quantities)
    .map(([productId, quantity]) => ({
      productId,
      quantity: parseInt(quantity, 10),
    }))
    .filter((item) => Number.isInteger(item.quantity) && item.quantity > 0);

  try {
    const response = await apiRequestWithSession(req, '/orders', {
      method: 'POST',
      body: {
        addressId: req.body.addressId,
        items,
      },
    });

    req.flash('success', response.message || 'Pedido creado correctamente.');
    return res.redirect('/client/orders');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo crear el pedido.'));
    return res.redirect(`/client/orders/create?commerce=${req.body.commerceId || ''}`);
  }
};

exports.clientDetail = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/orders/my-orders/${req.params.id}`);

    res.render('client/orders/detail', {
      title: 'Detalle del pedido',
      order: mapOrder(response.data),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el pedido.', '/client/orders');
  }
};

exports.commerceOrders = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/orders/commerce', {
      query: { status: 'Pending' },
    });

    res.render('commerce/orders/list', {
      title: 'Pedidos pendientes',
      orders: (response.data || []).map((order) => ({
        ...mapOrder(order),
        isPending: order.status === 'Pending',
      })),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar los pedidos.', '/commerce/home');
  }
};

exports.commerceOrderDetail = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/orders/commerce/${req.params.id}`);
    const order = mapOrder(response.data);

    res.render('commerce/orders/detail', {
      title: 'Detalle del pedido',
      order: {
        ...order,
        isPending: response.data.status === 'Pending',
      },
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el pedido.', '/commerce/orders');
  }
};

exports.processOrder = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/orders/${req.params.id}/assign-delivery`, {
      method: 'PATCH',
    });

    req.flash('success', response.message || 'Delivery asignado correctamente.');
    return res.redirect('/commerce/orders');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo asignar el delivery.'));
    return res.redirect('/commerce/orders');
  }
};

exports.deliveryOrders = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, '/orders/delivery', {
      query: { status: 'InProgress' },
    });

    res.render('delivery/orders/list', {
      title: 'Mis entregas',
      orders: (response.data || []).map(mapOrder),
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar las entregas.', '/delivery/home');
  }
};

exports.deliveryOrderDetail = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/orders/delivery/${req.params.id}`);
    const order = mapOrder(response.data);

    res.render('delivery/orders/detail', {
      title: 'Detalle del pedido',
      order: {
        ...order,
        hideAddress: !order.address,
        isInProcess: response.data.status === 'InProgress',
      },
    });
  } catch (error) {
    return handleApiPageError(req, res, error, 'Error al cargar el pedido.', '/delivery/orders');
  }
};

exports.completeOrder = async (req, res) => {
  try {
    const response = await apiRequestWithSession(req, `/orders/${req.params.id}/complete`, {
      method: 'PATCH',
    });

    req.flash('success', response.message || 'Pedido marcado como completado.');
    return res.redirect('/delivery/orders');
  } catch (error) {
    req.flash('error', getApiErrorMessage(error, 'No se pudo completar el pedido.'));
    return res.redirect('/delivery/orders');
  }
};
