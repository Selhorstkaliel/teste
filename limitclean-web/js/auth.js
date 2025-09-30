import { getByIndex, getByKey, putItem } from './db.js';
import { verifyPassword, signJWT, generateRandomId, hashPassword } from './utils/crypto.js';

const SESSION_KEY = 'limitclean-session';
let currentSession = null;
let attemptCount = 0;
let lockedUntil = 0;

const saveSession = (session) => {
  currentSession = session;
  if (session) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ token: session.token, userId: session.user.id, exp: session.exp })
    );
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
};

const getStoredSession = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Sessão corrompida', error);
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

export const initializeAuth = async () => {
  const stored = getStoredSession();
  if (!stored) return;
  const user = await getByKey('users', stored.userId);
  if (!user) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  if (stored.exp && Date.now() > stored.exp) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  currentSession = { token: stored.token, user, exp: stored.exp };
};

export const registerUser = async (data) => {
  const id = generateRandomId();
  const now = new Date().toISOString();
  const passHash = await hashPassword(data.password);
  const user = {
    id,
    name: data.name,
    email: data.email,
    username: data.username,
    role: data.role,
    passHash,
    phone: data.phone,
    createdAt: now,
  };
  await putItem('users', user);
  return user;
};

export const login = async (username, password) => {
  const now = Date.now();
  if (lockedUntil && now < lockedUntil) {
    throw new Error('Tentativas excedidas. Aguarde alguns segundos.');
  }
  if (!username || !password) {
    throw new Error('Informe usuário e senha.');
  }
  const user = await getByIndex('users', 'username', username);
  if (!user) {
    attemptCount += 1;
    if (attemptCount >= 5) {
      lockedUntil = now + 15000;
      attemptCount = 0;
    }
    throw new Error('Credenciais inválidas.');
  }
  const valid = await verifyPassword(password, user.passHash);
  if (!valid) {
    attemptCount += 1;
    if (attemptCount >= 5) {
      lockedUntil = now + 15000;
      attemptCount = 0;
    }
    throw new Error('Credenciais inválidas.');
  }
  attemptCount = 0;
  lockedUntil = 0;
  const exp = Date.now() + 1000 * 60 * 60;
  const token = await signJWT({ sub: user.id, role: user.role, exp });
  const session = { token, user, exp };
  saveSession(session);
  return user;
};

export const logout = () => {
  saveSession(null);
};

export const getSession = () => currentSession;

export const isAuthenticated = () => Boolean(currentSession);

export const requireRole = (roles) => {
  if (!currentSession) return false;
  if (!roles) return true;
  return roles.includes(currentSession.user.role);
};

export const updateSessionUser = (user) => {
  if (!currentSession) return;
  currentSession.user = user;
  saveSession(currentSession);
};
