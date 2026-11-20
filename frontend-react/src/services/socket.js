import { io } from 'socket.io-client';
import { getAccessToken } from './session.js';

export async function createAuthenticatedSocket(url) {
  const token = await getAccessToken();
  return io(url, {
    auth: token ? { token } : {},
    withCredentials: true
  });
}
