import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { STORAGE_KEYS } from '../config/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS.USER_TOKEN) || null);

  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [adminToken, setAdminToken] = useState(() => localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN) || null);
  const [loading, setLoading] = useState(true);

  // Sync Customer Profile on Mount
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      if (token) {
        try {
          const res = await api.getProfile();
          if (res && res.user) {
            setUser(res.user);
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('User session expired or invalid:', err.message);
          // If 401 or invalid token, clear user session
          if (err.status === 401) {
            setUser(null);
            setToken(null);
            localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_DATA);
          }
        }
      }

      if (adminToken) {
        try {
          const res = await api.getAdminProfile();
          if (res && res.admin) {
            setAdmin(res.admin);
            localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(res.admin));
          }
        } catch (err) {
          console.warn('Admin session expired or invalid:', err.message);
          if (err.status === 401 || err.status === 403) {
            setAdmin(null);
            setAdminToken(null);
            localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
          }
        }
      }

      setLoading(false);
    };

    initAuth();
  }, [token, adminToken]);

  // Customer Login
  const login = useCallback(async (email, password) => {
    const res = await api.login({ email, password });
    if (res && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem(STORAGE_KEYS.USER_TOKEN, res.token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(res.user));
    }
    return res;
  }, []);

  // Customer Register
  const register = useCallback(async ({ username, email, password, phone }) => {
    const res = await api.register({ username, email, password, phone });
    if (res && res.token) {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem(STORAGE_KEYS.USER_TOKEN, res.token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(res.user));
    }
    return res;
  }, []);

  // Customer Logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  }, []);

  // Customer Profile Update
  const updateProfile = useCallback(async ({ username, phone }) => {
    const res = await api.updateProfile({ username, phone });
    if (res && res.user) {
      setUser(res.user);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(res.user));
    }
    return res;
  }, []);

  // Admin Login
  const adminLogin = useCallback(async (email, password) => {
    const res = await api.adminLogin({ email, password });
    if (res && res.token) {
      setAdminToken(res.token);
      setAdmin(res.admin);
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, res.token);
      localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(res.admin));
    }
    return res;
  }, []);

  // Admin Register (provisioned by an authenticated admin)
  const adminRegister = useCallback(async ({ username, email, password, phone }) => {
    const res = await api.adminRegister({ username, email, password, phone });
    return res;
  }, []);

  // Admin Logout
  const adminLogout = useCallback(() => {
    setAdmin(null);
    setAdminToken(null);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateProfile,

        admin,
        adminToken,
        isAdminAuthenticated: !!adminToken && !!admin,
        adminLogin,
        adminRegister,
        adminLogout,

        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
