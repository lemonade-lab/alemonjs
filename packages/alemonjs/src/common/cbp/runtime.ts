import { randomUUID } from 'node:crypto';

export const deviceId = randomUUID();

let idCounter = 0;
const idPrefix = process.pid.toString(36) + Date.now().toString(36);

export const generateUniqueId = () => {
  return idPrefix + (++idCounter).toString(36);
};
