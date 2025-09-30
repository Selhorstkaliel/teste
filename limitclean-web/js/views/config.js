import {
  updateUserProfile,
  listUsers,
  listRepresentatives,
  listSellers,
  saveRepresentative,
  saveSeller,
  deleteRepresentative,
  deleteSeller,
  getRepresentativeByUser,
  getSellerByUser,
} from '../services/users.js';
import { updateSessionUser } from '../auth.js';

const renderProfileForm = (container, user) => {
  const form = document.createElement('form');
  form.className = 'form-grid card';
  form.innerHTML = `
    <h2>Meu perfil</h2>
    <label class="label">
      Nome completo
      <input class="input" name="name" value="${user.name || ''}" required />
    </label>
    <label class="label">
      E-mail
      <input class="input" name="email" type="email" value="${user.email || ''}" required />
    </label>
    <label class="label">
      Telefone
      <input class="input" name="phone" value="${user.phone || ''}" />
    </label>
    <label class="label">
      Nova senha (opcional)
      <input class="input" name="password" type="password" autocomplete="new-password" />
    </label>
    <button class="button" type="submit">Atualizar perfil</button>
    <p class="chip" id="profile-success" hidden>Dados atualizados.</p>
  `;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const changes = Object.fromEntries(formData.entries());
    if (!changes.password) {
      delete changes.password;
    }
    try {
      const updated = await updateUserProfile(user.id, changes);
      updateSessionUser(updated);
      form.querySelector('#profile-success').hidden = false;
    } catch (error) {
      console.error(error);
      alert('Não foi possível atualizar o perfil.');
    }
  });

  container.append(form);
};

const buildOption = (user) => {
  const option = document.createElement('option');
  option.value = user.id;
  option.textContent = `${user.name} (${user.username})`;
  return option;
};

const renderRepresentativesAdmin = async (container, users) => {
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h2>Representantes</h2>
    <div id="rep-list" class="form-grid"></div>
    <form id="rep-form" class="form-grid form-grid--two">
      <label class="label">
        Usuário
        <select class="select" name="userId" required></select>
      </label>
      <label class="label">
        Desconto padrão (R$)
        <input class="input" name="defaultDiscount" type="number" step="0.01" value="0" />
      </label>
      <button class="button" type="submit">Adicionar representante</button>
    </form>
  `;
  container.append(card);
  const repList = card.querySelector('#rep-list');
  const repForm = card.querySelector('#rep-form');
  const select = repForm.elements.userId;

  const refresh = async () => {
    const reps = await listRepresentatives();
    repList.innerHTML = '';
    reps.forEach((rep) => {
      const user = users.find((item) => item.id === rep.userId);
      if (!user) return;
      const item = document.createElement('article');
      item.className = 'card card--compact';
      item.innerHTML = `
        <strong>${user.name}</strong>
        <span class="text-muted">Desconto: R$ ${Number(rep.defaultDiscount).toFixed(2)}</span>
        <button class="button button--ghost" data-id="${rep.id}">Remover</button>
      `;
      item.querySelector('button').addEventListener('click', async () => {
        await deleteRepresentative(rep.id);
        refresh();
      });
      repList.append(item);
    });
    select.innerHTML = '<option value="">Selecione</option>';
    users
      .filter((user) => !reps.find((rep) => rep.userId === user.id))
      .forEach((user) => select.append(buildOption(user)));
  };

  repForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(repForm);
    await saveRepresentative({
      userId: formData.get('userId'),
      defaultDiscount: Number(formData.get('defaultDiscount')),
    });
    repForm.reset();
    refresh();
  });

  refresh();
};

const renderSellersAdmin = async (container, users) => {
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h2>Vendedores</h2>
    <div id="seller-list" class="form-grid"></div>
    <form id="seller-form" class="form-grid form-grid--two">
      <label class="label">
        Usuário
        <select class="select" name="userId" required></select>
      </label>
      <label class="label">
        Representante
        <select class="select" name="representativeId" required></select>
      </label>
      <label class="label">
        Desconto (R$)
        <input class="input" name="sellerDiscount" type="number" step="0.01" value="0" />
      </label>
      <button class="button" type="submit">Adicionar vendedor</button>
    </form>
  `;
  container.append(card);
  const sellerList = card.querySelector('#seller-list');
  const sellerForm = card.querySelector('#seller-form');
  const userSelect = sellerForm.elements.userId;
  const repSelect = sellerForm.elements.representativeId;

  const refresh = async () => {
    const [reps, sellers] = await Promise.all([listRepresentatives(), listSellers()]);
    sellerList.innerHTML = '';
    sellers.forEach((seller) => {
      const user = users.find((item) => item.id === seller.userId);
      const rep = reps.find((item) => item.id === seller.representativeId);
      if (!user) return;
      const repUser = users.find((item) => item.id === rep?.userId);
      const item = document.createElement('article');
      item.className = 'card card--compact';
      item.innerHTML = `
        <strong>${user.name}</strong>
        <span class="text-muted">Representante: ${repUser?.name || 'N/D'}</span>
        <span class="text-muted">Desconto: R$ ${Number(seller.sellerDiscount).toFixed(2)}</span>
        <button class="button button--ghost" data-id="${seller.id}">Remover</button>
      `;
      item.querySelector('button').addEventListener('click', async () => {
        await deleteSeller(seller.id);
        refresh();
      });
      sellerList.append(item);
    });
    userSelect.innerHTML = '<option value="">Selecione</option>';
    users
      .filter((user) => !sellers.find((seller) => seller.userId === user.id))
      .forEach((user) => userSelect.append(buildOption(user)));
    repSelect.innerHTML = '<option value="">Selecione</option>';
    reps.forEach((rep) => {
      const user = users.find((item) => item.id === rep.userId);
      if (!user) return;
      const option = document.createElement('option');
      option.value = rep.id;
      option.textContent = user.name;
      repSelect.append(option);
    });
  };

  sellerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(sellerForm);
    await saveSeller({
      userId: formData.get('userId'),
      representativeId: formData.get('representativeId'),
      sellerDiscount: Number(formData.get('sellerDiscount')),
    });
    sellerForm.reset();
    refresh();
  });

  refresh();
};

const renderRepresentativeSection = async (container, user) => {
  const rep = await getRepresentativeByUser(user.id);
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h2>Meus vendedores</h2>
    <p class="text-muted">Desconto padrão aplicado automaticamente: R$ ${
      rep?.defaultDiscount?.toFixed(2) || '0.00'
    }</p>
    <div id="seller-list" class="form-grid"></div>
    <form id="seller-form" class="form-grid form-grid--two">
      <label class="label">
        Usuário vendedor
        <select class="select" name="userId" required></select>
      </label>
      <label class="label">
        Desconto (R$)
        <input class="input" name="sellerDiscount" type="number" step="0.01" value="0" />
      </label>
      <button class="button" type="submit">Vincular vendedor</button>
    </form>
  `;
  container.append(card);
  const sellerList = card.querySelector('#seller-list');
  const sellerForm = card.querySelector('#seller-form');
  const userSelect = sellerForm.elements.userId;

  const refresh = async () => {
    const [users, sellers] = await Promise.all([listUsers(), listSellers()]);
    const mySellers = sellers.filter((item) => item.representativeId === rep?.id);
    sellerList.innerHTML = '';
    mySellers.forEach((seller) => {
      const userData = users.find((item) => item.id === seller.userId);
      const item = document.createElement('article');
      item.className = 'card card--compact';
      item.innerHTML = `
        <strong>${userData?.name || 'N/D'}</strong>
        <span class="text-muted">Desconto: R$ ${Number(seller.sellerDiscount).toFixed(2)}</span>
        <button class="button button--ghost" data-id="${seller.id}">Remover</button>
      `;
      item.querySelector('button').addEventListener('click', async () => {
        await deleteSeller(seller.id);
        refresh();
      });
      sellerList.append(item);
    });
    userSelect.innerHTML = '<option value="">Selecione</option>';
    users
      .filter((candidate) => !mySellers.find((seller) => seller.userId === candidate.id))
      .forEach((candidate) => userSelect.append(buildOption(candidate)));
  };

  sellerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(sellerForm);
    await saveSeller({
      userId: formData.get('userId'),
      representativeId: rep?.id,
      sellerDiscount: Number(formData.get('sellerDiscount')),
    });
    sellerForm.reset();
    refresh();
  });

  refresh();
};

const renderSellerInfo = async (container, user) => {
  const seller = await getSellerByUser(user.id);
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h2>Informações do vendedor</h2>
    <p>Desconto aplicado automaticamente: R$ ${
      seller?.sellerDiscount?.toFixed(2) || '0.00'
    }</p>
  `;
  container.append(card);
};

export const renderConfig = async ({ container, session }) => {
  const user = session?.user;
  if (!user) return;
  renderProfileForm(container, user);
  if (user.role === 'admin') {
    const users = await listUsers();
    await renderRepresentativesAdmin(container, users);
    await renderSellersAdmin(container, users);
  } else if (user.role === 'representante') {
    await renderRepresentativeSection(container, user);
  } else if (user.role === 'vendedor') {
    await renderSellerInfo(container, user);
  }
};
