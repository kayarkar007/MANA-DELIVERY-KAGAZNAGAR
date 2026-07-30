import AsyncStorage from '@react-native-async-storage/async-storage';

// Local development IP for Android Emulator (10.0.2.2) or local network IP
// Change to "https://manadelivery.in/api" for production
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

export async function apiFetch(endpoint, options = {}) {
  const token = await AsyncStorage.getItem('userToken');
  
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
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}
