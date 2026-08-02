import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { View, ActivityIndicator } from "react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider, useCart } from "./src/context/CartContext";
import { COLORS } from "./src/constants/theme";
import {
  setupNotificationChannel,
  registerForPushNotifications,
  savePushTokenToServer,
  setupNotificationTapHandler,
} from "./src/utils/notifications";

// Tab Screens
import HomeScreen from "./src/screens/HomeScreen";
import ShopsScreen from "./src/screens/ShopsScreen";
import CartScreen from "./src/screens/CartScreen";
import OrderHistoryScreen from "./src/screens/OrderHistoryScreen";
import ProfileScreen from "./src/screens/ProfileScreen";

// Stack Screens (modals/detail)
import LoginScreen from "./src/screens/LoginScreen";
import ProductDetailScreen from "./src/screens/ProductDetailScreen";
import ShopDetailScreen from "./src/screens/ShopDetailScreen";
import OrderTrackingScreen from "./src/screens/OrderTrackingScreen";
import CheckoutSuccessScreen from "./src/screens/CheckoutSuccessScreen";
import AddressScreen from "./src/screens/AddressScreen";
import WalletScreen from "./src/screens/WalletScreen";
import WishlistScreen from "./src/screens/WishlistScreen";
import SearchScreen from "./src/screens/SearchScreen";
import SupportScreen from "./src/screens/SupportScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabs() {
  const { cartCount } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.cardBorder,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textDark,
        tabBarLabelStyle: { fontWeight: "700", fontSize: 10 },
        tabBarIcon: ({ focused, color }) => {
          let iconName;
          if (route.name === "Home") iconName = focused ? "home" : "home-outline";
          else if (route.name === "Shops") iconName = focused ? "storefront" : "storefront-outline";
          else if (route.name === "CartTab") iconName = focused ? "cart" : "cart-outline";
          else if (route.name === "OrdersTab") iconName = focused ? "receipt" : "receipt-outline";
          else if (route.name === "ProfileTab") iconName = focused ? "person" : "person-outline";
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Shops" component={ShopsScreen} options={{ tabBarLabel: "Shops" }} />
      <Tab.Screen
        name="CartTab"
        component={CartScreen}
        options={{
          tabBarLabel: "Cart",
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.primary,
            color: COLORS.white,
            fontSize: 10,
            fontWeight: "900",
          },
        }}
      />
      <Tab.Screen name="OrdersTab" component={OrderHistoryScreen} options={{ tabBarLabel: "Orders" }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const navigationRef = useRef(null);

  useEffect(() => {
    setupNotificationChannel();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      const token = await registerForPushNotifications();
      await savePushTokenToServer(token);
    })();
    const unsub = setupNotificationTapHandler(navigationRef);
    return unsub;
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            {/* Main tab navigation */}
            <Stack.Screen name="MainTabs" component={BottomTabs} />

            {/* Product & Shop Detail */}
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
            <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />

            {/* Cart & Orders */}
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="CheckoutSuccess" component={CheckoutSuccessScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />

            {/* Profile sub-screens */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Address" component={AddressScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="Wishlist" component={WishlistScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />

            {/* Search & Notifications */}
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ animation: "fade_from_bottom" }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <AppNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
