exports.index = (req, res) => {
  let ctaHref = '/auth/login';
  let ctaLabel = 'Explorar comercios';

  if (req.session?.role === 'client') {
    ctaHref = '/client/commerces';
  } else if (req.session?.role === 'commerce') {
    ctaHref = '/commerce/home';
    ctaLabel = 'Ir a mi comercio';
  } else if (req.session?.role === 'delivery') {
    ctaHref = '/delivery/orders';
    ctaLabel = 'Ver pedidos asignados';
  } else if (req.session?.role === 'admin') {
    ctaHref = '/admin';
    ctaLabel = 'Ir al dashboard';
  }

  res.render('home', {
    title: 'AppCenar',
    message: 'Bienvenido a AppCenar',
    ctaHref,
    ctaLabel,
  });
};
