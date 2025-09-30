import { isAuthenticated, getSession, logout } from './auth.js';
import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderCadastro } from './views/cadastro.js';
import { renderConfig } from './views/config.js';
import { renderSupport } from './views/support.js';

const routes = {
  '#/login': renderLogin,
  '#/dashboard': renderDashboard,
  '#/cadastro': renderCadastro,
  '#/config': renderConfig,
  '#/support': renderSupport,
};

const protectedRoutes = new Set(['#/dashboard', '#/cadastro', '#/config', '#/support']);

let navElement;
let containerElement;
let onNavigateCallback;
let sharedContext = {};

const navItemsByRole = {
  admin: [
    { href: '#/dashboard', label: 'Dashboard' },
    { href: '#/cadastro', label: 'Cadastro' },
    { href: '#/support', label: 'Suporte' },
    { href: '#/config', label: 'Configuração' },
  ],
  representante: [
    { href: '#/dashboard', label: 'Dashboard' },
    { href: '#/cadastro', label: 'Cadastro' },
    { href: '#/support', label: 'Suporte' },
    { href: '#/config', label: 'Configuração' },
  ],
  vendedor: [
    { href: '#/dashboard', label: 'Dashboard' },
    { href: '#/cadastro', label: 'Cadastro' },
    { href: '#/support', label: 'Suporte' },
  ],
};

const renderNav = () => {
  if (!navElement) return;
  navElement.innerHTML = '';
  if (!isAuthenticated()) return;
  const session = getSession();
  const items = navItemsByRole[session.user.role] || [];
  items.forEach((item) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = item.href;
    link.textContent = item.label;
    if (location.hash === item.href) {
      link.setAttribute('aria-current', 'page');
    }
    li.append(link);
    navElement.append(li);
  });
  const logoutLi = document.createElement('li');
  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'button button--ghost';
  logoutBtn.type = 'button';
  logoutBtn.textContent = 'Sair';
  logoutBtn.addEventListener('click', () => {
    logout();
    location.hash = '#/login';
  });
  logoutLi.append(logoutBtn);
  navElement.append(logoutLi);
};

const renderRoute = async () => {
  let hash = window.location.hash || '#/login';
  if (!routes[hash]) {
    hash = '#/dashboard';
    window.location.hash = hash;
  }
  if (hash === '#/login' && isAuthenticated()) {
    window.location.hash = '#/dashboard';
    return;
  }
  if (protectedRoutes.has(hash) && !isAuthenticated()) {
    window.location.hash = '#/login';
    return;
  }
  renderNav();
  const view = routes[hash];
  if (!view || !containerElement) return;
  containerElement.innerHTML = '';
  const session = getSession();
  await view({
    container: containerElement,
    session,
    navigate: (href) => {
      window.location.hash = href;
    },
    onAuthenticated: () => {
      renderNav();
      window.location.hash = '#/dashboard';
    },
    ...sharedContext,
  });
  containerElement.focus();
  if (typeof onNavigateCallback === 'function') {
    onNavigateCallback(hash);
  }
};

export const setupRouter = (container, nav, callback, context = {}) => {
  containerElement = container;
  navElement = nav;
  onNavigateCallback = callback;
  sharedContext = context;
  window.addEventListener('hashchange', renderRoute);
  renderRoute();
};

export const forceRender = () => renderRoute();

export const updateRouterContext = (context) => {
  sharedContext = { ...sharedContext, ...context };
  renderNav();
};
