import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../api/client";

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Create high-priority Android channel with loud sound
export async function setupNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("mana-delivery-orders", {
      name: "Order Updates",
      description: "Order status, delivery alerts, and promotions",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#EF4444",
      enableLights: true,
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
    });
  }
}

// Request permissions and get push token
export async function registerForPushNotifications() {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "mana-delivery-customer",
  }).catch(() => null);

  return tokenData?.data || null;
}

// Save push token to server
export async function savePushTokenToServer(pushToken) {
  if (!pushToken) return;
  try {
    const userToken = await AsyncStorage.getItem("userToken");
    if (!userToken) return;
    await fetch(`${API_BASE_URL}/user/fcm-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ token: pushToken, platform: Platform.OS }),
    });
  } catch (_) {}
}

// Setup notification tap handler — returns unsubscribe function
export function setupNotificationTapHandler(navigationRef) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (!navigationRef?.current) return;

    if (data?.orderId) {
      navigationRef.current.navigate("OrderTracking", { orderId: data.orderId });
    } else if (data?.screen) {
      navigationRef.current.navigate(data.screen, data.params || {});
    }
  });
  return () => subscription.remove();
}
