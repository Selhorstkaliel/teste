export const toBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number(value || 0)
  );

export const parseToNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9,-]/g, '').replace('.', '').replace(',', '.');
  return Number.parseFloat(cleaned) || 0;
};
