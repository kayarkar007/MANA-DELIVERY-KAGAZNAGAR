import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manadelivery.in/api';

export async function apiFetch(endpoint, options = {}) {
  const token = await AsyncStorage.getItem('vendorToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) await clearSession();
      throw new Error(data.error || `Request failed: ${response.status}`);
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function saveSession(token, user) {
  await AsyncStorage.setItem('vendorToken', token);
  await AsyncStorage.setItem('vendorUser', JSON.stringify(user));
}

export async function clearSession() {
  await AsyncStorage.multiRemove(['vendorToken', 'vendorUser']);
}

export async function getStoredUser() {
  const s = await AsyncStorage.getItem('vendorUser');
  const token = await AsyncStorage.getItem('vendorToken');
  if (!s || !token || token.split('.').length !== 3) {
    await clearSession();
    return null;
  }
  try {
    return JSON.parse(s);
  } catch {
    await clearSession();
    return null;
  }
}
