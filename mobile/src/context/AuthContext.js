import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from storage on app start
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  // Email + Password login
  async function login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/mobile-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginType: 'email', email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, message: data.error || 'Login failed' };
      await _persistSession(data.token, data.user);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Phone OTP — Step 1: Send OTP
  async function sendOTP(phone) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/phone-otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, message: data.error || 'Failed to send OTP' };
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // Phone OTP — Step 2: Verify OTP
  async function verifyOTP(phone, otp) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/phone-otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { success: false, message: data.error || 'Invalid OTP' };
      await _persistSession(data.token, data.user);
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  async function _persistSession(tok, usr) {
    setToken(tok);
    setUser(usr);
    await AsyncStorage.setItem('userToken', tok);
    await AsyncStorage.setItem('userData', JSON.stringify(usr));
  }

  async function logout() {
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove(['userToken', 'userData']);
  }

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, login, sendOTP, verifyOTP, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
