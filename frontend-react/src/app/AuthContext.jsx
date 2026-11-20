import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api.js';
import { isNativePlatform } from '../services/platform.js';
import {
  clearAccessToken,
  clearLegacyBrowserSession,
  initializeNativeSession,
  storeAccessToken
} from '../services/session.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const token = await initializeNativeSession();
        if (isNativePlatform() && !token) return;

        const profile = await apiRequest('/api/auth/perfil');
        if (active) setUser(profile);
      } catch (error) {
        if (isNativePlatform() && error.status === 401) {
          try {
            await clearAccessToken();
          } catch (clearError) {
            if (active) setSessionError(clearError.message);
          }
        }
        if (active && error.status !== 401) {
          setSessionError(error.message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    sessionError,
    async signIn(userData) {
      const { token, ...profile } = userData;
      if (isNativePlatform()) {
        if (!token) throw new Error('No se recibió el token de sesión del servidor');
        await storeAccessToken(token);
      } else {
        clearLegacyBrowserSession();
      }
      setSessionError('');
      setUser(profile);
    },
    async signOut() {
      if (isNativePlatform()) {
        await clearAccessToken();
      } else {
        await apiRequest('/api/auth/logout', { method: 'POST' });
        clearLegacyBrowserSession();
      }
      setUser(null);
      setSessionError('');
    }
  }), [user, loading, sessionError]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
