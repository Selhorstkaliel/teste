const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary);
};

const base64ToBuffer = (base64) => {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer.buffer;
};

const base64UrlToBase64 = (value) => value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');

const getSalt = () => {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return salt;
};

export const hashPassword = async (password, saltInput) => {
  const salt = saltInput ? Uint8Array.from(atob(saltInput), (c) => c.charCodeAt(0)) : getSalt();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 120000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hash = bufferToBase64(derivedBits);
  return `${bufferToBase64(salt)}$${hash}`;
};

export const verifyPassword = async (password, stored) => {
  const [salt, hash] = stored.split('$');
  const comparison = await hashPassword(password, salt);
  return comparison === `${salt}$${hash}`;
};

export const generateRandomId = () => crypto.randomUUID();

const encodeBase64Url = (value) => btoa(value).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

const getSigningKey = async () => {
  const existing = localStorage.getItem('limitclean-sign-key');
  if (existing) {
    const raw = base64ToBuffer(existing);
    return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, [
      'sign',
      'verify',
    ]);
  }
  const key = await crypto.subtle.generateKey({ name: 'HMAC', hash: 'SHA-256' }, true, ['sign', 'verify']);
  const exported = await crypto.subtle.exportKey('raw', key);
  localStorage.setItem('limitclean-sign-key', bufferToBase64(exported));
  return key;
};

export const signJWT = async (payload) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const base64Header = encodeBase64Url(JSON.stringify(header));
  const base64Payload = encodeBase64Url(JSON.stringify(payload));
  const unsigned = `${base64Header}.${base64Payload}`;
  const key = await getSigningKey();
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(unsigned));
  const signature = encodeBase64Url(bufferToBase64(signatureBuffer));
  return `${unsigned}.${signature}`;
};

export const verifyJWT = async (token) => {
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) return false;
  const key = await getSigningKey();
  const unsigned = `${headerB64}.${payloadB64}`;
  const signatureBuffer = base64ToBuffer(base64UrlToBase64(signatureB64));
  const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, textEncoder.encode(unsigned));
  if (!isValid) return false;
  const payload = JSON.parse(
    textDecoder.decode(base64ToBuffer(base64UrlToBase64(payloadB64)))
  );
  if (payload.exp && Date.now() >= payload.exp) return false;
  return payload;
};
