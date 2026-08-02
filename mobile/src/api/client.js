import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://manadelivery.in/api';

export async function apiFetch(endpoint, options = {}) {
  const token = await AsyncStorage.getItem('userToken');
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
      // Only clear auth token if server explicitly says token is invalid (not just unauthorized endpoint)
      // Avoids accidentally wiping valid tokens when hitting old non-mobile routes
      const errMsg = data.error || `Request failed: ${response.status}`;
      throw new Error(errMsg);
    }
    return data;
  } catch (error) {
    if (error?.name === 'AbortError') throw new Error('Request timed out. Please try again.');
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
