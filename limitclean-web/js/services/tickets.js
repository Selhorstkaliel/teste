import { getAll, putItem, deleteItem } from '../db.js';
import { generateRandomId } from '../utils/crypto.js';

export const listTickets = () => getAll('tickets');

export const createTicket = async (payload) => {
  const ticket = {
    id: generateRandomId(),
    userId: payload.userId,
    title: payload.title,
    description: payload.description,
    createdAt: new Date().toISOString(),
  };
  await putItem('tickets', ticket);
  return ticket;
};

export const deleteTicket = (id) => deleteItem('tickets', id);
