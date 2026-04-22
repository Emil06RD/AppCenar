// ── Factory: genera un middleware que exige un rol específico ─────────────────
const requireRole = (role) => (req, res, next) => {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Debes iniciar sesión para acceder a esta página.');
    return res.redirect('/auth/login');
  }

  if (req.session.role !== role) {
    // El usuario está logueado pero con otro rol → redirigir a su propio panel
    const panelRedirect = {
      client:   '/client/home',
      delivery: '/delivery/home',
      commerce: '/commerce/home',
      admin:    '/admin',
    };
    return res.redirect(panelRedirect[req.session.role] || '/');
  }

  return next();
};

// ── Middlewares por rol ───────────────────────────────────────────────────────
const requireClient   = requireRole('client');
const requireDelivery = requireRole('delivery');
const requireCommerce = requireRole('commerce');
const requireAdmin    = requireRole('admin');

module.exports = { requireClient, requireDelivery, requireCommerce, requireAdmin };
