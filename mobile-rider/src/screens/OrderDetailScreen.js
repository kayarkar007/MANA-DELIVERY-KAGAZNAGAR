import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { updateOrderStatus } from '../api/rider';
import { openGoogleMaps } from './SmartRouteScreen';
import { COLORS, SHADOWS } from '../constants/theme';

const NEXT_STATUS = {
  assigned: { label: '✅ Accept Order', status: 'accepted', color: '#10b981' },
  accepted: { label: '📦 Mark Picked Up', status: 'picked_up', color: '#3b82f6' },
  picked_up: { label: '🚚 Out for Delivery', status: 'out_for_delivery', color: '#f97316' },
  out_for_delivery: { label: '✅ Confirm Delivery', status: 'delivered', color: '#10b981', needsOtp: true },
};

export default function OrderDetailScreen({ navigation }) {
  const { params } = useRoute();
  const [order, setOrder] = useState(params.order);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const next = NEXT_STATUS[order.deliveryStatus];

  async function handleStatusUpdate() {
    if (next.needsOtp && otp.length !== 4) {
      Alert.alert('OTP Required', 'Enter the 4-digit delivery PIN from the customer.');
      return;
    }
    setLoading(true);
    try {
      const result = await updateOrderStatus(order._id, next.status, next.needsOtp ? otp : null);
      if (result.success) {
        setOrder(result.data);
        if (next.status === 'delivered') {
          Alert.alert('🎉 Delivered!', 'Order marked as delivered successfully.', [
            { text: 'Go Back', onPress: () => navigation.goBack() },
          ]);
        }
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    Alert.alert('Decline Order', 'Are you sure you want to decline this order?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateOrderStatus(order._id, 'declined');
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.orderId}>Order #{order._id?.slice(-6).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: next ? next.color + '22' : COLORS.accentLight }]}>
            <Text style={[styles.statusBadgeText, { color: next ? next.color : COLORS.accent }]}>
              {order.deliveryStatus?.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>CUSTOMER INFO</Text>
          <Text style={styles.value}>{order.customerName}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={14} color={COLORS.primary} />
            <Text style={styles.phone}>{order.customerPhone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.address}>{order.address}</Text>
          </View>

          <TouchableOpacity
            style={styles.mapsBtn}
            onPress={() => openGoogleMaps(order.address, order.latitude, order.longitude)}
          >
            <Ionicons name="navigate" size={15} color={COLORS.background} />
            <Text style={styles.mapsBtnText}>Navigate to Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Order Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ORDER ITEMS</Text>
          {(order.items || []).map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.itemRow}>
            <Text style={styles.totalLabel}>Total to Collect</Text>
            <Text style={styles.totalValue}>₹{order.total}</Text>
          </View>
          <View style={[styles.paymentBadge, { backgroundColor: order.paymentMethod === 'cod' ? COLORS.goldBg : COLORS.accentLight }]}>
            <Ionicons
              name={order.paymentMethod === 'cod' ? 'cash-outline' : 'card-outline'}
              size={13}
              color={order.paymentMethod === 'cod' ? COLORS.gold : COLORS.accent}
            />
            <Text style={[styles.paymentText, { color: order.paymentMethod === 'cod' ? COLORS.gold : COLORS.accent }]}>
              {order.paymentMethod?.toUpperCase()} Payment
            </Text>
          </View>
        </View>

        {/* OTP Input (for delivery confirmation) */}
        {next?.needsOtp && (
          <View style={[styles.card, styles.otpCard]}>
            <View style={styles.otpHeader}>
              <Ionicons name="lock-closed" size={18} color={COLORS.gold} />
              <Text style={styles.cardTitle}>DELIVERY PIN VERIFICATION</Text>
            </View>
            <Text style={styles.otpHint}>
              Ask the customer for their 4-digit delivery PIN shown in their app
            </Text>
            <TextInput
              style={styles.otpInput}
              placeholder="Enter 4-digit PIN"
              placeholderTextColor={COLORS.textDark}
              keyboardType="numeric"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
            />
            {otp.length === 4 && (
              <View style={styles.otpReadyBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                <Text style={styles.otpReadyText}>PIN entered — tap Confirm Delivery</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {next && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: next.color }]}
              onPress={handleStatusUpdate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.actionText}>{next.label}</Text>
                </>
              )}
            </TouchableOpacity>

            {order.deliveryStatus === 'assigned' && (
              <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                <Ionicons name="close-circle-outline" size={18} color={COLORS.danger} />
                <Text style={styles.declineText}>Decline Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 16,
    flexWrap: 'wrap',
    gap: 8,
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
  orderId: { color: COLORS.text, fontWeight: '900', fontSize: 16, flex: 1, marginLeft: 12 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    ...SHADOWS.small,
  },
  otpCard: {
    borderColor: COLORS.gold,
    borderWidth: 1.5,
  },
  otpHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: {
    color: COLORS.textDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  value: { color: COLORS.text, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  phone: { color: COLORS.primary, fontSize: 14, fontWeight: '600', flex: 1 },
  address: { color: COLORS.textMuted, fontSize: 13, flex: 1 },
  mapsBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  mapsBtnText: { color: COLORS.background, fontWeight: '900', fontSize: 13 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' },
  itemName: { color: COLORS.text, flex: 1, fontSize: 14, fontWeight: '600' },
  itemQty: { color: COLORS.textDark, marginHorizontal: 8, fontSize: 13 },
  itemPrice: { color: COLORS.text, fontWeight: '800', fontSize: 14 },
  divider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 10 },
  totalLabel: { color: COLORS.textMuted, fontWeight: '700', fontSize: 14 },
  totalValue: { color: COLORS.accent, fontWeight: '900', fontSize: 20 },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  paymentText: { fontWeight: '800', fontSize: 12 },
  otpHint: { color: COLORS.textMuted, fontSize: 12, marginBottom: 14, lineHeight: 18 },
  otpInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
    padding: 18,
    color: COLORS.text,
    fontSize: 28,
    textAlign: 'center',
    letterSpacing: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gold,
    fontWeight: '900',
  },
  otpReadyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: COLORS.accentLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  otpReadyText: { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
  actions: { padding: 16, gap: 12 },
  actionBtn: {
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...SHADOWS.medium,
  },
  actionText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  declineBtn: {
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.danger,
  },
  declineText: { color: COLORS.danger, fontWeight: '800', fontSize: 15 },
});
