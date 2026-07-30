import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manadelivery.in/api';

export async function apiFetch(endpoint, options = {}) {
  const token = await AsyncStorage.getItem('adminToken');
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Request failed: ${response.status}`);
  return data;
}

export async function saveSession(token, user) {
  await AsyncStorage.setItem('adminToken', token);
  await AsyncStorage.setItem('adminUser', JSON.stringify(user));
}

export async function clearSession() { await AsyncStorage.multiRemove(['adminToken', 'adminUser']); }

export async function getStoredUser() {
  const s = await AsyncStorage.getItem('adminUser');
  return s ? JSON.parse(s) : null;
}
