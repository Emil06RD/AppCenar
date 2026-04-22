const bcrypt       = require('bcrypt');
const crypto       = require('crypto');          // nativo de Node — sin instalar
const User         = require('../models/User');
const Commerce     = require('../models/Commerce');
const CommerceType = require('../models/CommerceType');

async function syncCommerceState(user) {
  if (user.role !== 'commerce') return;

  await Commerce.findOneAndUpdate(
    { user: user._id },
    { isActive: Boolean(user.isActive && user.isApproved) }
  );
}

// ── GET /auth/login ───────────────────────────────────────────────────────────
exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Iniciar sesión' });
};

// ── POST /auth/login ──────────────────────────────────────────────────────────
exports.postLogin = async (req, res) => {
  const { identifier, password } = req.body;

  // Destinos por rol
  const roleRedirect = {
    client:   '/client/home',
    delivery: '/delivery/home',
    commerce: '/commerce/home',
    admin:    '/admin',
  };

  const fail = (msg) => {
    req.flash('error', msg);
    req.flash('formData', JSON.stringify({ identifier })); // repoblar campo
    return res.redirect('/auth/login');
  };

  try {
    if (!identifier || !password) return fail('Ingresa tu usuario/email y contraseña.');

    // ── Buscar por email o userName ───────────────────────────────────────────
    const query = identifier.includes('@')
      ? { email: identifier.trim().toLowerCase() }
      : { userName: identifier.trim().toLowerCase() };

    const user = await User.findOne(query);

    if (!user) return fail('Credenciales incorrectas.');

    // ── Verificar contraseña ──────────────────────────────────────────────────
    const match = await bcrypt.compare(password, user.password);
    if (!match) return fail('Credenciales incorrectas.');

    // ── Verificar cuenta activa ───────────────────────────────────────────────
    if (!user.isActive) {
      return fail('Tu cuenta aún no está activa. Contacta al administrador.');
    }

    // ── Guardar sesión ────────────────────────────────────────────────────────
    req.session.userId   = user._id;
    req.session.role     = user.role;
    req.session.userName = user.userName;

    // ── Redirigir según rol ───────────────────────────────────────────────────
    return res.redirect(roleRedirect[user.role] || '/');

  } catch (err) {
    console.error('Error en login:', err.message);
    return fail('Ocurrió un error inesperado. Inténtalo de nuevo.');
  }
};

// ── GET /auth/logout ──────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Error al cerrar sesión:', err.message);
    res.redirect('/auth/login');
  });
};



// ── GET /auth/register-user ───────────────────────────────────────────────────
exports.getRegisterUser = (req, res) => {
  // Recuperar datos del formulario y errores guardados en flash
  const formData = req.flash('formData')[0];
  res.render('auth/register-user', {
    title: 'Crear cuenta',
    data: formData ? JSON.parse(formData) : {},
  });
};

// ── POST /auth/register-user ──────────────────────────────────────────────────
exports.postRegisterUser = async (req, res) => {
  const { firstName, lastName, userName, email, phone, password, role } = req.body;

  try {
    // ── Validaciones únicas contra la BD ─────────────────────────────────────
    const existingEmail    = await User.findOne({ email });
    const existingUserName = await User.findOne({ userName: userName.toLowerCase() });

    if (existingEmail) {
      req.flash('errors', ['Ya existe una cuenta con ese email']);
      req.flash('formData', JSON.stringify(req.body));
      return res.redirect('/auth/register-user');
    }

    if (existingUserName) {
      req.flash('errors', ['Ese nombre de usuario ya está en uso']);
      req.flash('formData', JSON.stringify(req.body));
      return res.redirect('/auth/register-user');
    }

    // ── Hash de contraseña ────────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Generar token de activación ───────────────────────────────────────────
    const rawActivationToken    = crypto.randomBytes(32).toString('hex');
    const hashedActivationToken = crypto.createHash('sha256').update(rawActivationToken).digest('hex');

    // ── Crear usuario ─────────────────────────────────────────────────────────
    await User.create({
      firstName:       firstName.trim(),
      lastName:        lastName.trim(),
      userName:        userName.trim().toLowerCase(),
      email:           email.trim().toLowerCase(),
      phone:           phone.trim(),
      password:        hashedPassword,
      role,
      isActive:        false,
      isAvailable:     role === 'delivery',
      activationToken: hashedActivationToken,
    });

    // ── Mostrar link en consola (TODO: reemplazar con nodemailer) ─────────────
    const activationLink = `http://localhost:3000/auth/activate/${rawActivationToken}`;
    console.log('\n========================================');
    console.log('  ENLACE DE ACTIVACIÓN (solo consola)');
    console.log(`  Usuario : ${userName.trim().toLowerCase()}`);
    console.log(`  Email   : ${email.trim().toLowerCase()}`);
    console.log(`  Link    : ${activationLink}`);
    console.log('========================================\n');

    req.flash('success', '¡Cuenta creada! Revisa tu correo para activarla.');
    return res.redirect('/auth/login');

  } catch (err) {
    console.error('Error en registro:', err.message);
    req.flash('error', 'Ocurrió un error al crear la cuenta. Inténtalo de nuevo.');
    req.flash('formData', JSON.stringify(req.body));
    return res.redirect('/auth/register-user');
  }
};

// ── GET /auth/register-commerce ───────────────────────────────────────────────
exports.getRegisterCommerce = async (req, res) => {
  try {
    const commerceTypes = await CommerceType.find().lean();
    res.render('auth/register-commerce', {
      title: 'Registrar comercio',
      commerceTypes,
    });
  } catch (err) {
    console.error('Error cargando tipos de comercio:', err.message);
    res.render('auth/register-commerce', {
      title: 'Registrar comercio',
      commerceTypes: [],
    });
  }
};

// ── POST /auth/register-commerce ──────────────────────────────────────────────
exports.postRegisterCommerce = async (req, res) => {
  const {
    firstName, lastName, userName, email, phone,
    password, commerceName, commerceType, openingTime, closingTime,
  } = req.body;

  const redirectBack = () => res.redirect('/auth/register-commerce');

  let newUser = null; // referencia para rollback si falla Commerce

  try {
    // ── 1. Unicidad de email y userName ───────────────────────────────────────
    const [existingEmail, existingUserName] = await Promise.all([
      User.findOne({ email: email.trim().toLowerCase() }),
      User.findOne({ userName: userName.trim().toLowerCase() }),
    ]);

    if (existingEmail) {
      req.flash('errors', ['Ya existe una cuenta con ese email']);
      req.flash('formData', JSON.stringify(req.body));
      return redirectBack();
    }
    if (existingUserName) {
      req.flash('errors', ['Ese nombre de usuario ya está en uso']);
      req.flash('formData', JSON.stringify(req.body));
      return redirectBack();
    }

    // ── 2. Verificar que el CommerceType existe en la BD ──────────────────────
    const typeExists = await CommerceType.findById(commerceType);
    if (!typeExists) {
      req.flash('errors', ['El tipo de comercio seleccionado no es válido']);
      req.flash('formData', JSON.stringify(req.body));
      return redirectBack();
    }

    // ── 3. Hash de contraseña ─────────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── 4. Generar token de activación ────────────────────────────────────────
    const rawActivationToken    = crypto.randomBytes(32).toString('hex');
    const hashedActivationToken = crypto.createHash('sha256').update(rawActivationToken).digest('hex');

    // ── 5. Crear User con role commerce (inactivo) ────────────────────────────
    newUser = await User.create({
      firstName:       firstName.trim(),
      lastName:        lastName.trim(),
      userName:        userName.trim().toLowerCase(),
      email:           email.trim().toLowerCase(),
      phone:           phone.trim(),
      password:        hashedPassword,
      role:            'commerce',
      isActive:        false,
      activationToken: hashedActivationToken,
    });

    // ── 6. Crear Commerce relacionado con el User ─────────────────────────────
    await Commerce.create({
      user:         newUser._id,
      name:         commerceName.trim(),
      commerceType: commerceType,
      openingTime:  openingTime.trim(),
      closingTime:  closingTime.trim(),
      logo:         'default-logo.png', // upload real pendiente
      isActive:     false,
    });

    // ── Mostrar link en consola (TODO: reemplazar con nodemailer) ─────────────
    const activationLink = `http://localhost:3000/auth/activate/${rawActivationToken}`;
    console.log('\n========================================');
    console.log('  ENLACE DE ACTIVACIÓN — COMERCIO (solo consola)');
    console.log(`  Usuario : ${userName.trim().toLowerCase()}`);
    console.log(`  Email   : ${email.trim().toLowerCase()}`);
    console.log(`  Link    : ${activationLink}`);
    console.log('========================================\n');

    req.flash('success', '¡Comercio registrado! Revisa tu correo para activar la cuenta.');
    return res.redirect('/auth/login');

  } catch (err) {
    console.error('Error en registro de comercio:', err.message);

    // ── Rollback: eliminar el User si ya fue creado pero Commerce falló ───────
    if (newUser) {
      await User.findByIdAndDelete(newUser._id).catch(() => {});
    }

    req.flash('error', 'Ocurrió un error al registrar el comercio. Inténtalo de nuevo.');
    req.flash('formData', JSON.stringify(req.body));
    return redirectBack();
  }
};


// ── GET /auth/forgot-password ─────────────────────────────────────────────────
exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { title: 'Recuperar contraseña' });
};

// ── POST /auth/forgot-password ────────────────────────────────────────────────
exports.postForgotPassword = async (req, res) => {
  const { identifier } = req.body;            // puede ser email o userName

  // Mensaje genérico — nunca revelar si el usuario existe o no
  const genericMsg = 'Si existe una cuenta con ese dato, recibirás el enlace en breve.';

  try {
    // Buscar por email o userName
    const query = identifier.includes('@')
      ? { email: identifier.trim().toLowerCase() }
      : { userName: identifier.trim().toLowerCase() };

    const user = await User.findOne(query);

    if (!user) {
      // Respuesta genérica para no exponer datos
      req.flash('success', genericMsg);
      return res.redirect('/auth/forgot-password');
    }

    // ── Generar token aleatorio (32 bytes → 64 chars hex) ─────────────────────
    const rawToken   = crypto.randomBytes(32).toString('hex');
    // Guardar el hash del token en BD (seguridad: el raw solo viaja en la URL)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetToken        = hashedToken;
    user.resetTokenExpires = Date.now() + 60 * 60 * 1000;  // 1 hora
    await user.save();

    // ── Construir el link de reset ────────────────────────────────────────────
    const resetLink = `http://localhost:3000/auth/reset-password/${rawToken}`;

    // TODO: reemplazar este console.log con el envío real de email (nodemailer)
    console.log('\n========================================');
    console.log('  ENLACE DE RECUPERACIÓN (solo consola)');
    console.log(`  Usuario : ${user.userName}`);
    console.log(`  Email   : ${user.email}`);
    console.log(`  Link    : ${resetLink}`);
    console.log('========================================\n');

    req.flash('success', genericMsg);
    return res.redirect('/auth/forgot-password');

  } catch (err) {
    console.error('Error en forgot-password:', err.message);
    req.flash('error', 'Ocurrió un error inesperado. Inténtalo de nuevo.');
    return res.redirect('/auth/forgot-password');
  }
};

// ── GET /auth/reset-password/:token ──────────────────────────────────────────
exports.getResetPassword = async (req, res) => {
  const { token } = req.params;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken:        hashedToken,
      resetTokenExpires: { $gt: Date.now() },   // token no expirado
    });

    if (!user) {
      req.flash('error', 'El enlace de recuperación no es válido o ha expirado.');
      return res.redirect('/auth/forgot-password');
    }

    res.render('auth/reset-password', {
      title: 'Nueva contraseña',
      token,                                     // raw token → va en el form hidden
    });

  } catch (err) {
    console.error('Error en get reset-password:', err.message);
    req.flash('error', 'Ocurrió un error inesperado.');
    return res.redirect('/auth/forgot-password');
  }
};

// ── POST /auth/reset-password/:token ─────────────────────────────────────────
exports.postResetPassword = async (req, res) => {
  const { token }    = req.params;
  const { password } = req.body;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetToken:        hashedToken,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash('error', 'El enlace de recuperación no es válido o ha expirado.');
      return res.redirect('/auth/forgot-password');
    }

    // ── Hash de la nueva contraseña ───────────────────────────────────────────
    user.password          = await bcrypt.hash(password, 10);

    // ── Invalidar el token (uso único) ────────────────────────────────────────
    user.resetToken        = null;
    user.resetTokenExpires = null;

    await user.save();

    req.flash('success', '¡Contraseña actualizada! Ya puedes iniciar sesión.');
    return res.redirect('/auth/login');

  } catch (err) {
    console.error('Error en post reset-password:', err.message);
    req.flash('error', 'Ocurrió un error inesperado. Inténtalo de nuevo.');
    return res.redirect(`/auth/reset-password/${token}`);
  }
};


// -- GET /auth/activate/:token -------------------------------------------------
exports.getActivateAccount = async (req, res) => {
  const { token } = req.params;

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({ activationToken: hashedToken });

    if (!user) {
      req.flash('error', 'El enlace de activación no es válido o ya fue usado.');
      return res.redirect('/auth/login');
    }

    // -- Activar cuenta y limpiar token ---------------------------------------
    user.isActive        = true;
    user.activationToken = null;
    await user.save();
    await syncCommerceState(user);

    req.flash('success', '¡Cuenta activada! Ya puedes iniciar sesión.');
    return res.redirect('/auth/login');

  } catch (err) {
    console.error('Error en activación de cuenta:', err.message);
    req.flash('error', 'Ocurrió un error al activar la cuenta.');
    return res.redirect('/auth/login');
  }
};
