import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, clearSession } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on app start
    getStoredUser().then((storedUser) => {
      if (storedUser) setUser(storedUser);
    }).finally(() => setLoading(false));
  }, []);

  const signIn = (userData) => {
    setUser(userData);
  };

  const signOut = async () => {
    await clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
