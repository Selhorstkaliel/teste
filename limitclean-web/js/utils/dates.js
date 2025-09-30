const toDate = (value) => (value instanceof Date ? value : new Date(value));

export const formatDate = (value, options = {}) => {
  const date = toDate(value);
  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...options,
  });
};

export const startOfMonth = (value) => {
  const date = toDate(value);
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const endOfMonth = (value) => {
  const date = toDate(value);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const startOfYear = (value) => {
  const date = toDate(value);
  return new Date(date.getFullYear(), 0, 1);
};

export const endOfYear = (value) => {
  const date = toDate(value);
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
};

export const startOfFortnight = (value) => {
  const date = toDate(value);
  const day = date.getDate();
  const firstDay = day <= 15 ? 1 : 16;
  return new Date(date.getFullYear(), date.getMonth(), firstDay);
};

export const endOfFortnight = (value) => {
  const date = toDate(value);
  const day = date.getDate();
  const lastDay = day <= 15 ? 15 : new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return new Date(date.getFullYear(), date.getMonth(), lastDay, 23, 59, 59, 999);
};

export const differenceInDays = (later, earlier) => {
  const diff = toDate(later).getTime() - toDate(earlier).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
};

export const isBetween = (value, start, end) => {
  const time = toDate(value).getTime();
  return time >= toDate(start).getTime() && time <= toDate(end).getTime();
};
