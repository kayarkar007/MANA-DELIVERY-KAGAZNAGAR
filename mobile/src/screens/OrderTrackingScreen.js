import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { COLORS, SHADOWS } from '../constants/theme';

export default function OrderTrackingScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { orderId } = route.params || {};
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchOrderDetails() {
    if (!orderId) return;
    try {
      const data = await apiFetch(`/orders/${orderId}`);
      if (data.order || data.success) {
        setOrder(data.order || data.data);
      }
    } catch (e) {
      console.error('Failed to fetch order', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 10000); // Auto refresh every 10s
    return () => clearInterval(interval);
  }, [orderId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrderDetails();
  };

  const status = order?.status || 'placed';

  const steps = [
    { key: 'placed', label: 'Order Placed', icon: 'checkmark-circle' },
    { key: 'confirmed', label: 'Accepted by Vendor', icon: 'storefront' },
    { key: 'assigned', label: 'Rider Assigned', icon: 'bicycle' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'navigate' },
    { key: 'delivered', label: 'Delivered', icon: 'ribbon' },
  ];

  const statusIndex = {
    placed: 0,
    confirmed: 1,
    assigned: 2,
    out_for_delivery: 3,
    delivered: 4,
    cancelled: -1,
  }[status] ?? 0;

  function copyOtpToClipboard(otp) {
    if (otp) {
      Clipboard.setString(otp.toString());
      Alert.alert('Copied!', 'Delivery OTP copied to clipboard.');
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('MainTabs')}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Order Tracker</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching order tracking updates...</Text>
        </View>
      ) : !order ? (
        <View style={styles.loadingView}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
          <Text style={styles.loadingText}>Order details could not be loaded.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          {/* Order ID & Status Header Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.orderIdLabel}>ORDER #{order._id?.slice(-6)?.toUpperCase()}</Text>
                <Text style={styles.orderTime}>
                  Placed on {new Date(order.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.statusBadge, status === 'delivered' ? styles.badgeSuccess : styles.badgeActive]}>
                <Text style={styles.statusBadgeText}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
              </View>
            </View>

            {/* Delivery OTP Highlight Card */}
            {order.deliveryOtp && status !== 'delivered' && status !== 'cancelled' && (
              <View style={styles.otpCard}>
                <View style={styles.otpLeft}>
                  <Ionicons name="key-outline" size={24} color={COLORS.gold} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.otpTitle}>DELIVERY VERIFICATION OTP</Text>
                    <Text style={styles.otpSub}>Share with rider upon arrival</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.otpBadge}
                  onPress={() => copyOtpToClipboard(order.deliveryOtp)}
                >
                  <Text style={styles.otpText}>{order.deliveryOtp}</Text>
                  <Ionicons name="copy-outline" size={14} color={COLORS.gold} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Stepper Progress Card */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>Delivery Status Timeline</Text>
            {steps.map((step, index) => {
              const isPassed = index <= statusIndex;
              const isCurrent = index === statusIndex;

              return (
                <View key={step.key} style={styles.stepRow}>
                  <View style={styles.stepIconColumn}>
                    <View
                      style={[
                        styles.stepIconBg,
                        isPassed && styles.stepIconPassed,
                        isCurrent && styles.stepIconCurrent,
                      ]}
                    >
                      <Ionicons
                        name={step.icon}
                        size={16}
                        color={isPassed ? COLORS.white : COLORS.textDark}
                      />
                    </View>
                    {index < steps.length - 1 && (
                      <View style={[styles.stepLine, isPassed && styles.stepLinePassed]} />
                    )}
                  </View>

                  <View style={styles.stepTextColumn}>
                    <Text style={[styles.stepLabel, isPassed && styles.stepLabelPassed]}>
                      {step.label}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.stepCurrentSub}>In Progress (Express Delivery)</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Delivery Address Details */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>Delivery Address</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-sharp" size={18} color={COLORS.primary} />
              <Text style={styles.addressText}>{order.deliveryAddress || 'Kagaznagar Express Zone'}</Text>
            </View>
          </View>

          {/* Itemized Order Summary */}
          <View style={styles.cardSection}>
            <Text style={styles.sectionHeader}>Order Items</Text>
            {order.items?.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name} x {item.quantity}</Text>
                <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
              </View>
            ))}

            <View style={styles.divider} />

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Payable Amount</Text>
              <Text style={styles.summaryValue}>₹{order.totalAmount || order.total}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  loadingView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: 10,
    fontSize: 13,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    ...SHADOWS.small,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderIdLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.text,
  },
  orderTime: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
  },
  otpCard: {
    backgroundColor: COLORS.goldBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.gold,
    padding: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  otpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  otpTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.gold,
  },
  otpSub: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  otpBadge: {
    backgroundColor: COLORS.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
  },
  otpText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 2,
  },
  cardSection: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 16,
    marginTop: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepIconColumn: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconPassed: {
    backgroundColor: COLORS.accent,
  },
  stepIconCurrent: {
    backgroundColor: COLORS.primary,
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 2,
  },
  stepLinePassed: {
    backgroundColor: COLORS.accent,
  },
  stepTextColumn: {
    justifyContent: 'center',
    paddingTop: 4,
  },
  stepLabel: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  stepLabelPassed: {
    color: COLORS.text,
    fontWeight: '800',
  },
  stepCurrentSub: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginLeft: 8,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.accent,
  },
});
