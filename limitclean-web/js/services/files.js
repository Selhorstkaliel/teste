import { putItem, getAll } from '../db.js';
import { generateRandomId } from '../utils/crypto.js';

export const saveFile = async (payload) => {
  const record = {
    id: generateRandomId(),
    entryId: payload.entryId || null,
    ticketId: payload.ticketId || null,
    name: payload.name,
    mime: payload.mime,
    size: payload.size,
    blobRef: payload.blob,
  };
  await putItem('files', record);
  return record;
};

export const listFiles = () => getAll('files');
