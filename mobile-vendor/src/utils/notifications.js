import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('mana-vendor-orders', {
      name: 'Vendor Incoming Orders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500, 250, 500],
      lightColor: '#F59E0B',
      sound: 'default',
    });
  }
}

export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId: "b8ff9736-9c4b-4f76-9197-82ea1c9a9cd5" });
    return tokenData.data;
  } catch (e) {
    console.error('Failed to get Vendor push token', e);
    return null;
  }
}

export async function savePushTokenToServer(token) {
  if (!token) return;
  try {
    await AsyncStorage.setItem('vendor_push_token', token);
    await apiFetch('/user/fcm-token', {
      method: 'POST',
      body: JSON.stringify({ fcmToken: token }),
    });
  } catch (e) {
    console.warn('Could not save vendor push token to server', e);
  }
}
