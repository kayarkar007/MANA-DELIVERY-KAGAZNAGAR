import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadSession() {
    try {
      const savedUser = await AsyncStorage.getItem('userData');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Failed to load user session', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loginWithPhoneOtp(phone, otp) {
    const data = await apiFetch('/auth/phone-otp/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });

    if (data.success && data.user) {
      setUser(data.user);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      await AsyncStorage.setItem('userToken', data.user.id);
      return data.user;
    }
    throw new Error(data.error || 'Login failed');
  }

  async function logout() {
    setUser(null);
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('userToken');
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithPhoneOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
