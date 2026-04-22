// ── isAuthenticated ───────────────────────────────────────────────────────────
// Protege cualquier ruta: si no hay sesión, redirige al login.
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  req.flash('error', 'Debes iniciar sesión para acceder a esta página.');
  return res.redirect('/auth/login');
};

// ── redirectIfAuthenticated ───────────────────────────────────────────────────
// Para rutas públicas (login, register): si ya hay sesión, manda al dashboard.
const roleRedirect = {
  client:   '/client/home',
  delivery: '/delivery/home',
  commerce: '/commerce/home',
  admin:    '/admin',
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect(roleRedirect[req.session.role] || '/');
  }
  return next();
};

module.exports = { isAuthenticated, redirectIfAuthenticated };
