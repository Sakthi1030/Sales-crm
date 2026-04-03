/**
 * context/AuthContext.jsx
 * Provides authentication state and helpers to the entire app.
 * Stores the JWT in localStorage and attaches it to every axios request.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Attach Authorization header globally once token is available
function setAxiosToken(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(() => localStorage.getItem('nexus_token'));
  const [loading, setLoading] = useState(true);

  // On mount: if we have a stored token, fetch the current user
  useEffect(() => {
    const init = async () => {
      if (token) {
        setAxiosToken(token);
        try {
          const res = await axios.get('/api/auth/me');
          setUser(res.data);
        } catch {
          // Token expired or invalid — clear it
          localStorage.removeItem('nexus_token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    init();
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('nexus_token', t);
    setAxiosToken(t);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nexus_token');
    setAxiosToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
