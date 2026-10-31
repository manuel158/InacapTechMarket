import { apiUrl } from './platform.js';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(path), { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data?.mensaje
      ? data.mensaje
      : `Error del servidor (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export const apiPost = (path, body) =>
  apiRequest(path, { method: 'POST', body: JSON.stringify(body) });

export const apiDelete = path =>
  apiRequest(path, { method: 'DELETE' });

export function formatPrice(price) {
  return `$${Number(price).toLocaleString('es-CL')}`;
}
