import { Capacitor } from '@capacitor/core';

const defaultApiBaseUrl = 'https://inacaptechmarket.onrender.com';

export const apiBaseUrl = Capacitor.isNativePlatform()
  ? (import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).replace(/\/+$/, '')
  : '';

export function apiUrl(path) {
  return `${apiBaseUrl}${path}`;
}

export function socketUrl() {
  return apiBaseUrl || undefined;
}
