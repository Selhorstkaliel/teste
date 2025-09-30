export const getEffectiveDiscount = (user, payloadDiscount = 0, context = {}) => {
  if (!user) return 0;
  const role = user.role;
  if (role === 'vendedor') {
    return context.seller?.sellerDiscount ?? 0;
  }
  if (role === 'representante') {
    return context.representative?.defaultDiscount ?? 0;
  }
  if (role === 'admin') {
    return Number(payloadDiscount) || 0;
  }
  return 0;
};
