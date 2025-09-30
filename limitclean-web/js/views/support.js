import { createTicket, listTickets } from '../services/tickets.js';
import { saveFile } from '../services/files.js';
import { formatDate } from '../utils/dates.js';

export const renderSupport = async ({ container, session }) => {
  const user = session?.user;
  if (!user) return;

  const section = document.createElement('section');
  section.className = 'card';
  section.innerHTML = `
    <h1>Central de suporte</h1>
    <form id="ticket-form" class="form-grid">
      <label class="label">
        Título
        <input class="input" name="title" required />
      </label>
      <label class="label">
        Descrição
        <textarea class="textarea" name="description" rows="4" required></textarea>
      </label>
      <label class="label">
        Anexo
        <input class="input" type="file" name="attachment" accept="image/*,application/pdf" />
      </label>
      <button class="button" type="submit">Abrir ticket</button>
      <p class="chip" hidden id="ticket-success">Ticket registrado com sucesso.</p>
    </form>
    <section class="card card--compact">
      <h2>Meus tickets</h2>
      <ul id="ticket-list" class="form-grid"></ul>
    </section>
  `;
  container.append(section);

  const form = section.querySelector('#ticket-form');
  const success = section.querySelector('#ticket-success');
  const listElement = section.querySelector('#ticket-list');

  const renderTickets = async () => {
    const tickets = (await listTickets()).filter((ticket) => ticket.userId === user.id);
    listElement.innerHTML = '';
    tickets
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .forEach((ticket) => {
        const item = document.createElement('li');
        item.className = 'card card--compact';
        item.innerHTML = `
          <strong>${ticket.title}</strong>
          <p class="text-muted">${ticket.description}</p>
          <span class="text-muted">${formatDate(ticket.createdAt)}</span>
        `;
        listElement.append(item);
      });
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const ticket = await createTicket({
      userId: user.id,
      title: formData.get('title'),
      description: formData.get('description'),
    });
    const attachment = formData.get('attachment');
    if (attachment && attachment.size) {
      await saveFile({
        ticketId: ticket.id,
        name: attachment.name,
        mime: attachment.type,
        size: attachment.size,
        blob: attachment,
      });
    }
    success.hidden = false;
    form.reset();
    renderTickets();
  });

  renderTickets();
};
