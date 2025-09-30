import { login } from '../auth.js';

export const renderLogin = async ({ container, onAuthenticated }) => {
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h1>Bem-vindo à LimitClean</h1>
    <p class="text-muted">
      Ambiente demonstrativo offline-first. Use as credenciais seed ou cadastre novos usuários localmente.
    </p>
    <form class="form-grid" id="login-form">
      <label class="label">
        Usuário
        <input class="input" name="username" autocomplete="username" required />
      </label>
      <label class="label">
        Senha
        <input class="input" type="password" name="password" autocomplete="current-password" required />
      </label>
      <button class="button" type="submit">Entrar</button>
      <p class="alert" role="alert" hidden id="login-error"></p>
    </form>
  `;
  container.append(card);

  const form = card.querySelector('#login-form');
  const errorBox = card.querySelector('#login-error');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const username = formData.get('username').trim();
    const password = formData.get('password');
    try {
      await login(username, password);
      errorBox.hidden = true;
      onAuthenticated();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
    }
  });
};
