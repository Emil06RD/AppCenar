const API_BASE_URL = (process.env.APICENAR_API_BASE_URL || 'http://localhost:4000/api').replace(/\/+$/, '');

class ApiRequestError extends Error {
  constructor(status, message, errors = [], payload = null) {
    super(message || 'API request failed');
    this.name = 'ApiRequestError';
    this.status = status;
    this.errors = Array.isArray(errors) ? errors : [];
    this.payload = payload;
  }
}

function buildUrl(pathname, query = {}) {
  const basePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const url = new URL(`${API_BASE_URL}${basePath}`);

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, value);
  });

  return url.toString();
}

function isFormData(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

async function parseResponse(response) {
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return { message: raw };
  }
}

async function apiRequest(pathname, options = {}) {
  const {
    method = 'GET',
    body,
    token,
    headers = {},
    query,
  } = options;

  const requestHeaders = { ...headers };
  let requestBody;

  if (body !== undefined && body !== null) {
    if (isFormData(body)) {
      requestBody = body;
    } else {
      requestHeaders['Content-Type'] = 'application/json';
      requestBody = JSON.stringify(body);
    }
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(pathname, query), {
    method,
    headers: requestHeaders,
    body: requestBody,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      payload.message || 'No se pudo completar la solicitud.',
      payload.errors || [],
      payload
    );
  }

  return payload;
}

function normalizeRole(roleValue) {
  const normalized = String(roleValue || '').trim().toLowerCase();
  const roleMap = {
    admin: 'admin',
    client: 'client',
    commerce: 'commerce',
    delivery: 'delivery',
  };

  return roleMap[normalized] || normalized;
}

function normalizeUser(user = {}) {
  return {
    ...user,
    id: user.id || user._id || null,
    role: normalizeRole(user.role),
  };
}

function roleRedirectPath(role) {
  const redirects = {
    client: '/client/home',
    delivery: '/delivery/home',
    commerce: '/commerce/home',
    admin: '/admin',
  };

  return redirects[role] || '/';
}

function setSessionAuth(req, authData = {}) {
  const user = normalizeUser(authData.user);

  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.userName = user.userName;
  req.session.authToken = authData.token;
  req.session.authUser = user;
  req.session.authExpiresAt = authData.expiresAt || null;
}

function clearSessionAuth(req) {
  delete req.session.userId;
  delete req.session.role;
  delete req.session.userName;
  delete req.session.authToken;
  delete req.session.authUser;
  delete req.session.authExpiresAt;
}

function getSessionToken(req) {
  return req.session?.authToken || null;
}

async function apiRequestWithSession(req, pathname, options = {}) {
  return apiRequest(pathname, {
    ...options,
    token: options.token || getSessionToken(req),
  });
}

function getRenderableAuthState(req) {
  if (!req.session?.authToken || !req.session?.authUser) {
    return null;
  }

  return {
    token: req.session.authToken,
    user: req.session.authUser,
  };
}

module.exports = {
  ApiRequestError,
  apiRequest,
  apiRequestWithSession,
  clearSessionAuth,
  getRenderableAuthState,
  getSessionToken,
  normalizeRole,
  normalizeUser,
  roleRedirectPath,
  setSessionAuth,
};
