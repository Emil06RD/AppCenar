const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId && req.session.authToken) {
    return next();
  }

  if (req.session) {
    delete req.session.userId;
    delete req.session.role;
    delete req.session.userName;
    delete req.session.authToken;
    delete req.session.authUser;
    delete req.session.authExpiresAt;
  }

  req.flash('error', 'Debes iniciar sesion para acceder a esta pagina.');
  return res.redirect('/auth/login');
};

const roleRedirect = {
  client: '/client/home',
  delivery: '/delivery/home',
  commerce: '/commerce/home',
  admin: '/admin',
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId && req.session.authToken) {
    return res.redirect(roleRedirect[req.session.role] || '/');
  }

  return next();
};

module.exports = { isAuthenticated, redirectIfAuthenticated };
