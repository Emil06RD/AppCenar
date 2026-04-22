(function () {
  const mountNode = document.getElementById('landing-react-root');

  if (!mountNode || !window.React || !window.ReactDOM) {
    return;
  }

  const React = window.React;
  const root = window.ReactDOM.createRoot(mountNode);
  const title = mountNode.dataset.title || 'Bienvenido a AppCenar';
  const ctaHref = mountNode.dataset.ctaHref || '/auth/login';
  const ctaLabel = mountNode.dataset.ctaLabel || 'Explorar comercios';
  const isAuthenticated = mountNode.dataset.isAuthenticated === 'true';

  const features = [
    {
      icon: 'bi-shop-window',
      title: 'Comercios reales',
      text: 'Explora menus por categoria y encuentra tus lugares favoritos mas rapido.',
    },
    {
      icon: 'bi-bag-check',
      title: 'Pedidos claros',
      text: 'Arma tu orden, revisa ITBIS y elige tu direccion sin salir del flujo.',
    },
    {
      icon: 'bi-bicycle',
      title: 'Entrega conectada',
      text: 'El seguimiento entre comercio y delivery se mantiene ordenado y simple.',
    },
  ];

  function FeatureCard(props) {
    return React.createElement(
      'article',
      { className: 'col-12 col-md-4' },
      React.createElement(
        'div',
        { className: 'appcenar-feature-card h-100' },
        React.createElement('i', { className: `bi ${props.icon} appcenar-feature-icon` }),
        React.createElement('h3', { className: 'h5 fw-bold mb-2' }, props.title),
        React.createElement('p', { className: 'mb-0 text-muted' }, props.text)
      )
    );
  }

  function LandingHome() {
    return React.createElement(
      'section',
      { className: 'appcenar-landing-shell' },
      React.createElement(
        'div',
        { className: 'appcenar-hero card border-0 overflow-hidden' },
        React.createElement(
          'div',
          { className: 'card-body p-4 p-md-5' },
          React.createElement(
            'div',
            { className: 'row align-items-center g-4' },
            React.createElement(
              'div',
              { className: 'col-12 col-lg-7' },
              React.createElement(
                'div',
                { className: 'appcenar-kicker' },
                isAuthenticated ? 'Tu acceso rapido a AppCenar' : 'Comida, comercios y entregas en un solo lugar'
              ),
              React.createElement('h1', { className: 'display-5 fw-bold mt-3 mb-3' }, title),
              React.createElement(
                'p',
                { className: 'lead text-dark-emphasis mb-4' },
                'Descubre comercios, organiza pedidos y mueve cada entrega con una experiencia mas limpia y visual.'
              ),
              React.createElement(
                'div',
                { className: 'd-flex flex-column flex-sm-row gap-3' },
                React.createElement(
                  'a',
                  { href: ctaHref, className: 'btn btn-warning btn-lg fw-semibold' },
                  React.createElement('i', { className: 'bi bi-arrow-right-circle me-2' }),
                  ctaLabel
                ),
                React.createElement(
                  'a',
                  {
                    href: isAuthenticated ? '/client/favorites' : '/auth/register-user',
                    className: 'btn btn-outline-dark btn-lg fw-semibold',
                  },
                  isAuthenticated ? 'Ver favoritos' : 'Crear cuenta'
                )
              )
            ),
            React.createElement(
              'div',
              { className: 'col-12 col-lg-5' },
              React.createElement(
                'div',
                { className: 'appcenar-showcase' },
                React.createElement(
                  'div',
                  { className: 'appcenar-stat-card' },
                  React.createElement('span', { className: 'appcenar-stat-label' }, 'Categorias'),
                  React.createElement('strong', { className: 'appcenar-stat-value' }, 'Comercios, favoritos y pedidos')
                ),
                React.createElement(
                  'div',
                  { className: 'appcenar-showcase-panel' },
                  React.createElement('span', { className: 'badge text-bg-warning mb-3' }, 'AppCenar'),
                  React.createElement('h2', { className: 'h4 fw-bold mb-2' }, 'Explora sin perderte'),
                  React.createElement(
                    'p',
                    { className: 'text-muted mb-0' },
                    'La portada ahora dirige al flujo correcto y suma una visual mas moderna sin cambiar la base Handlebars.'
                  )
                )
              )
            )
          )
        )
      ),
      React.createElement(
        'div',
        { className: 'row g-4 mt-1' },
        features.map((feature) =>
          React.createElement(FeatureCard, {
            key: feature.title,
            icon: feature.icon,
            title: feature.title,
            text: feature.text,
          })
        )
      )
    );
  }

  root.render(React.createElement(LandingHome));
})();
