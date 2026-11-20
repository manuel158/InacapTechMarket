import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { isNativePlatform } from './platform.js';

const TOKEN_KEY = 'authToken';
const LEGACY_TOKEN_KEY = 'token';

export async function getAccessToken() {
  return isNativePlatform()
    ? SecureStorage.getItem(TOKEN_KEY)
    : null;
}

export async function initializeNativeSession() {
  if (!isNativePlatform()) {
    clearLegacyBrowserSession();
    return null;
  }

  const secureToken = await SecureStorage.getItem(TOKEN_KEY);
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem('usuario');

  if (secureToken) {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    return secureToken;
  }

  if (!legacyToken) return null;

  await SecureStorage.setItem(TOKEN_KEY, legacyToken);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  return legacyToken;
}

export async function storeAccessToken(token) {
  if (isNativePlatform()) {
    await SecureStorage.setItem(TOKEN_KEY, token);
  }
}

export async function clearAccessToken() {
  if (isNativePlatform()) {
    await SecureStorage.removeItem(TOKEN_KEY);
  }
  clearLegacyBrowserSession();
}

export function clearLegacyBrowserSession() {
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem('usuario');
}
