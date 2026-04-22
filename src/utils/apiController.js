const { ApiRequestError, clearSessionAuth } = require('../services/api');

function getApiErrorMessage(error, fallback) {
  if (error instanceof ApiRequestError) {
    if (error.errors.length) {
      return error.errors.map((item) => item.msg || item.message || String(item)).join(', ');
    }

    return error.message || fallback;
  }

  return fallback;
}

function handleApiPageError(req, res, error, fallbackMessage, redirectTo) {
  if (error instanceof ApiRequestError && error.status === 401) {
    clearSessionAuth(req);
    req.flash('error', 'Tu sesion vencio. Inicia sesion de nuevo.');
    return res.redirect('/auth/login');
  }

  req.flash('error', getApiErrorMessage(error, fallbackMessage));
  return res.redirect(redirectTo);
}

module.exports = {
  getApiErrorMessage,
  handleApiPageError,
};
