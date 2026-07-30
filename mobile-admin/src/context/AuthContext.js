import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, clearSession } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getStoredUser().then(setUser).finally(() => setLoading(false)); }, []);
  return (
    <AuthContext.Provider value={{ user, loading, signIn: setUser, signOut: async () => { await clearSession(); setUser(null); } }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
