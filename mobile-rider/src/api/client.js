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
  const token = await AsyncStorage.getItem('riderToken');
  if (!userStr || !token || token.split('.').length !== 3) {
    await clearSession();
    return null;
  }
  try {
    return JSON.parse(userStr);
  } catch {
    await clearSession();
    return null;
  }
}
