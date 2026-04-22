const express = require('express');
const path = require('path');
const { engine } = require('express-handlebars');
const session = require('express-session');
const flash = require('connect-flash');
const { getRenderableAuthState } = require('./services/api');

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const commerceRoutes = require('./routes/commerceRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'appcenar_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));

app.use(flash());

app.use((req, res, next) => {
  res.locals.success = req.flash('success')[0] || null;
  res.locals.error = req.flash('error')[0] || null;
  res.locals.errors = req.flash('errors') || [];

  const formData = req.flash('formData')[0];
  res.locals.formData = formData ? JSON.parse(formData) : {};

  res.locals.session = req.session || {};
  const authState = getRenderableAuthState(req);
  res.locals.authStateJson = JSON.stringify(authState).replace(/</g, '\\u003c');
  res.locals.nav = {
    isClient: req.session?.role === 'client',
    isCommerce: req.session?.role === 'commerce',
    isDelivery: req.session?.role === 'delivery',
    isAdmin: req.session?.role === 'admin',
  };

  next();
});

app.engine(
  'hbs',
  engine({
    extname: '.hbs',
    defaultLayout: 'layout',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
  })
);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/client', clientRoutes);
app.use('/commerce', commerceRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/admin', adminRoutes);

module.exports = app;
