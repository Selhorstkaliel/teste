import { getAll, getByIndex, getByKey, putItem, deleteItem } from '../db.js';
import { generateRandomId, hashPassword } from '../utils/crypto.js';

export const listUsers = () => getAll('users');

export const findUserById = (id) => getByKey('users', id);

export const findUserByUsername = (username) => getByIndex('users', 'username', username);

export const updateUserProfile = async (id, changes) => {
  const user = await findUserById(id);
  if (!user) throw new Error('Usuário não encontrado');
  const updated = { ...user, ...changes };
  if (changes.password) {
    updated.passHash = await hashPassword(changes.password);
    delete updated.password;
  }
  await putItem('users', updated);
  return updated;
};

export const listRepresentatives = () => getAll('representatives');

export const saveRepresentative = async (data) => {
  const payload = {
    id: data.id || generateRandomId(),
    userId: data.userId,
    defaultDiscount: Number(data.defaultDiscount) || 0,
  };
  await putItem('representatives', payload);
  return payload;
};

export const deleteRepresentative = (id) => deleteItem('representatives', id);

export const listSellers = () => getAll('sellers');

export const saveSeller = async (data) => {
  const payload = {
    id: data.id || generateRandomId(),
    userId: data.userId,
    representativeId: data.representativeId,
    sellerDiscount: Number(data.sellerDiscount) || 0,
  };
  await putItem('sellers', payload);
  return payload;
};

export const deleteSeller = (id) => deleteItem('sellers', id);

export const getRepresentativeByUser = (userId) => getByIndex('representatives', 'userId', userId);

export const getSellerByUser = (userId) => getByIndex('sellers', 'userId', userId);

export const getUsersWithRoles = async () => {
  const [users, reps, sellers] = await Promise.all([
    listUsers(),
    listRepresentatives(),
    listSellers(),
  ]);
  return users.map((user) => ({
    ...user,
    representative: reps.find((rep) => rep.userId === user.id) || null,
    seller: sellers.find((seller) => seller.userId === user.id) || null,
  }));
};
