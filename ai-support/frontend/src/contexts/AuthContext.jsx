import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [company, setCompany] = useState(() => {
    try { return JSON.parse(localStorage.getItem('company')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(({ data }) => {
          setUser(data.user);
          setCompany(data.company);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('company', JSON.stringify(data.company));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('company');
          setUser(null);
          setCompany(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('company', JSON.stringify(data.company));
    setUser(data.user);
    setCompany(data.company);
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await authAPI.register(formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('company', JSON.stringify(data.company));
    setUser(data.user);
    setCompany(data.company);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    setUser(null);
    setCompany(null);
  }, []);

  const updateCompany = useCallback(async (updates) => {
    const { data } = await authAPI.updateCompany(updates);
    setCompany(data.company);
    localStorage.setItem('company', JSON.stringify(data.company));
    return data.company;
  }, []);

  return (
    <AuthContext.Provider value={{ user, company, loading, login, register, logout, updateCompany }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
