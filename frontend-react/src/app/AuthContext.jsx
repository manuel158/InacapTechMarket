import { createContext, useContext, useMemo, useState } from 'react';

const AuthContext = createContext(null);

function readUser() {
  if (!localStorage.getItem('token')) return null;

  try {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('No se pudo leer la sesión guardada:', error);
    localStorage.removeItem('usuario');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);

  const value = useMemo(() => ({
    user,
    signIn(userData) {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('usuario', JSON.stringify(userData));
      setUser(userData);
    },
    signOut() {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setUser(null);
    }
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
