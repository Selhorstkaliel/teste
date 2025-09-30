import { getAll, getByKey, putItem, deleteItem } from '../db.js';
import { generateRandomId } from '../utils/crypto.js';
import { getEffectiveDiscount } from './discounts.js';
import { getRepresentativeByUser, getSellerByUser } from './users.js';

const ENTRY_STORE = 'entries';

const baseEntry = (payload, effectiveDiscount) => {
  const valor = Number(payload.valor) || 0;
  const desconto = Number(effectiveDiscount) || 0;
  const liquido = Math.max(0, valor - desconto);
  const now = new Date().toISOString();
  return {
    id: payload.id || generateRandomId(),
    tipo: payload.tipo,
    doc: payload.doc,
    nome: payload.nome,
    telefone: payload.telefone,
    vendedor: payload.vendedor,
    valor,
    desconto,
    liquido,
    status: payload.status || 'Restrição',
    feito: Boolean(payload.feito),
    createdAt: payload.createdAt || now,
    updatedAt: now,
    createdBy: payload.createdBy,
  };
};

export const createEntry = async (payload, user) => {
  const representative = await getRepresentativeByUser(user.id);
  const seller = await getSellerByUser(user.id);
  const effectiveDiscount = getEffectiveDiscount(user, payload.desconto, {
    representative,
    seller,
  });
  const entry = baseEntry({ ...payload, createdBy: user.id }, effectiveDiscount);
  await putItem(ENTRY_STORE, entry);
  return entry;
};

export const updateEntry = async (id, changes) => {
  const existing = await getByKey(ENTRY_STORE, id);
  if (!existing) throw new Error('Registro não encontrado');
  const updated = { ...existing, ...changes, updatedAt: new Date().toISOString() };
  if (changes.valor !== undefined || changes.desconto !== undefined) {
    const valor = Number(updated.valor) || 0;
    const desconto = Number(updated.desconto) || 0;
    updated.liquido = Math.max(0, valor - desconto);
  }
  await putItem(ENTRY_STORE, updated);
  return updated;
};

export const updateEntryStatus = async (id, status) => updateEntry(id, { status });

export const listEntries = () => getAll(ENTRY_STORE);

export const getRecentEntries = async (limit = 50) => {
  const entries = await listEntries();
  return entries
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

export const deleteEntry = (id) => deleteItem(ENTRY_STORE, id);

export const calculateStats = async () => {
  const entries = await listEntries();
  let bruto = 0;
  let liquido = 0;
  let limpezasCount = 0;
  let ratingCount = 0;
  const statusCount = { Restrição: 0, Finalizado: 0, Reprotocolo: 0 };
  let ratingFeito = 0;
  entries.forEach((entry) => {
    bruto += Number(entry.valor) || 0;
    liquido += Number(entry.liquido) || 0;
    if (entry.tipo === 'limpeza') limpezasCount += 1;
    if (entry.tipo === 'rating') ratingCount += 1;
    if (statusCount[entry.status] !== undefined) {
      statusCount[entry.status] += 1;
    }
    if (entry.tipo === 'rating' && entry.feito) ratingFeito += 1;
  });
  const ratingNaoFeito = ratingCount - ratingFeito;
  return {
    bruto,
    liquido,
    limpezasCount,
    ratingCount,
    statusCount,
    ratingFeito,
    ratingNaoFeito,
  };
};

export const filterEntriesByPeriod = async (start, end) => {
  const entries = await listEntries();
  return entries.filter((entry) => {
    const created = new Date(entry.createdAt).getTime();
    return created >= start.getTime() && created <= end.getTime();
  });
};
