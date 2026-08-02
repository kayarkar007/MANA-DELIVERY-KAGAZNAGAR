import React, { useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../constants/theme";

export default function CheckoutSuccessScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { orderId, total, estimatedMinutes = 30 } = route.params || {};

  const scale = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 50,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      {/* Animated Success Icon */}
      <Animated.View style={[styles.iconCircle, { transform: [{ scale }] }]}>
        <Ionicons name="checkmark" size={52} color="#fff" />
      </Animated.View>

      <Text style={styles.title}>Order Placed!</Text>
      <Text style={styles.sub}>Your order is confirmed and{"\n"}will reach you soon ??</Text>

      {/* Order Info Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Order ID</Text>
          <Text style={styles.rowValue}>#{orderId?.slice(-6)?.toUpperCase() || "---"}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total Paid</Text>
          <Text style={styles.rowValue}>?{total || 0}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Estimated Delivery</Text>
          <Text style={[styles.rowValue, { color: COLORS.accent }]}>~{estimatedMinutes} mins</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Payment</Text>
          <Text style={[styles.rowValue, { color: COLORS.accent }]}>Cash on Delivery</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity
        style={styles.primaryBtn}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate("OrderTracking", { orderId })
        }
      >
        <Ionicons name="navigate-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.primaryBtnText}>Track My Order</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryBtn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("MainTabs")}
      >
        <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    alignItems: "center", paddingHorizontal: 24,
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.accent,
    alignItems: "center", justifyContent: "center",
    marginBottom: 24, marginTop: 20,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: 30, fontWeight: "900", color: COLORS.text,
    letterSpacing: -0.5, marginBottom: 8,
  },
  sub: {
    fontSize: 14, color: COLORS.textMuted, textAlign: "center",
    lineHeight: 22, marginBottom: 28,
  },
  card: {
    width: "100%", backgroundColor: COLORS.card,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 20, marginBottom: 24, ...SHADOWS.small,
  },
  row: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 10,
  },
  rowLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: "600" },
  rowValue: { fontSize: 14, color: COLORS.text, fontWeight: "800" },
  divider: { height: 1, backgroundColor: COLORS.cardBorder },
  primaryBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 32,
    width: "100%", justifyContent: "center",
    marginBottom: 12, ...SHADOWS.small,
  },
  primaryBtnText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  secondaryBtn: {
    paddingVertical: 14, width: "100%", alignItems: "center",
    borderRadius: 14, borderWidth: 1, borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
  },
  secondaryBtnText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "700" },
});
