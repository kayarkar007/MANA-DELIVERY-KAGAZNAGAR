import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manadelivery.in/api';

/** Core fetch wrapper with automatic Bearer JWT injection */
export async function apiFetch(endpoint, options = {}) {
  const token = await AsyncStorage.getItem('riderToken');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

/** Save token + user after login */
export async function saveSession(token, user) {
  await AsyncStorage.setItem('riderToken', token);
  await AsyncStorage.setItem('riderUser', JSON.stringify(user));
}

/** Clear session on logout */
export async function clearSession() {
  await AsyncStorage.multiRemove(['riderToken', 'riderUser']);
}

/** Get stored user object */
export async function getStoredUser() {
  const userStr = await AsyncStorage.getItem('riderUser');
  return userStr ? JSON.parse(userStr) : null;
}
