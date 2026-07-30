import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { updateOrderStatus } from '../api/rider';
import { openGoogleMaps } from './SmartRouteScreen';

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
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.orderId}>Order #{order._id?.slice(-6).toUpperCase()}</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>👤 Customer</Text>
        <Text style={styles.value}>{order.customerName}</Text>
        <Text style={styles.phone}>📞 {order.customerPhone}</Text>
        <Text style={styles.address}>📍 {order.address}</Text>

        <TouchableOpacity
          style={styles.mapsBtn}
          onPress={() => openGoogleMaps(order.address, order.deliveryLocation?.latitude, order.deliveryLocation?.longitude)}
        >
          <Text style={styles.mapsBtnText}>🗺️ Navigate to Customer (Google Maps)</Text>
        </TouchableOpacity>
      </View>

      {/* Order Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛒 Items</Text>
        {(order.items || []).map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQty}>x{item.quantity}</Text>
            <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{order.total}</Text>
        </View>
        <Text style={styles.payment}>Payment: {order.paymentMethod?.toUpperCase()}</Text>
      </View>

      {/* Current Status */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Status</Text>
        <Text style={styles.statusText}>{order.deliveryStatus?.replace(/_/g, ' ').toUpperCase()}</Text>
      </View>

      {/* OTP Input (for delivery) */}
      {next?.needsOtp && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔢 Delivery PIN</Text>
          <Text style={styles.otpHint}>Ask the customer for their 4-digit delivery PIN</Text>
          <TextInput
            style={styles.otpInput}
            placeholder="0000"
            placeholderTextColor="#475569"
            keyboardType="numeric"
            maxLength={4}
            value={otp}
            onChangeText={setOtp}
          />
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
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionText}>{next.label}</Text>}
          </TouchableOpacity>

          {order.deliveryStatus === 'assigned' && (
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
              <Text style={styles.declineText}>❌ Decline Order</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, paddingTop: 60 },
  backBtn: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
  orderId: { color: '#fff', fontWeight: '900', fontSize: 18 },
  card: { margin: 16, marginBottom: 0, backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  cardTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  value: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 4 },
  phone: { color: '#3b82f6', fontSize: 14, marginBottom: 4 },
  address: { color: '#94a3b8', fontSize: 13, marginBottom: 12 },
  mapsBtn: { backgroundColor: '#10b981', borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 4 },
  mapsBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { color: '#e2e8f0', flex: 1, fontSize: 14 },
  itemQty: { color: '#64748b', marginHorizontal: 8 },
  itemPrice: { color: '#fff', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 8 },
  totalLabel: { color: '#94a3b8', fontWeight: '700' },
  totalValue: { color: '#fff', fontWeight: '900', fontSize: 18 },
  payment: { color: '#f59e0b', fontWeight: '700', marginTop: 8 },
  statusText: { color: '#10b981', fontWeight: '800', fontSize: 16 },
  otpHint: { color: '#64748b', fontSize: 12, marginBottom: 12 },
  otpInput: { backgroundColor: '#1e293b', borderRadius: 10, padding: 16, color: '#fff', fontSize: 24, textAlign: 'center', letterSpacing: 8, borderWidth: 1, borderColor: '#334155' },
  actions: { padding: 16, gap: 12 },
  actionBtn: { borderRadius: 14, padding: 18, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  declineBtn: { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  declineText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
