'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('nubex_token');
    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('nubex_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    const { token, user } = await api.post('/auth/login', { identifier, password });
    localStorage.setItem('nubex_token', token);
    setUser(user);
    return user;
  };

  const logout = () => {
    localStorage.removeItem('nubex_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
