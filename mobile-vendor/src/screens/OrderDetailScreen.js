import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { getOrder, updateOrder } from '../api/vendor';

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

export default function OrderDetailScreen({ navigation }) {
  const { params } = useRoute();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    try {
      const res = await getOrder(params.orderId);
      setOrder(res.data);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [params.orderId]);

  async function handleStatus(status) {
    setActionLoading(true);
    try {
      const res = await updateOrder(order._id, status);
      setOrder(res.data);
      Alert.alert('Updated', `Order status changed to ${status}`);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#f59e0b" /></View>;
  if (!order) return <View style={s.center}><Text style={{ color: '#fff' }}>Order not found</Text></View>;

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Order #{order._id?.slice(-6).toUpperCase()}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>CUSTOMER</Text>
        <Text style={s.value}>{order.customerName}</Text>
        <Text style={s.sub}>{order.customerPhone}</Text>
        <Text style={s.sub}>📍 {order.address}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>ITEMS ({order.items?.length || 0})</Text>
        {(order.items || []).map((item, idx) => (
          <View key={idx} style={s.itemRow}>
            <Text style={s.itemName}>{item.name}</Text>
            <Text style={s.itemQty}>x{item.quantity}</Text>
            <Text style={s.itemPrice}>₹{item.price * item.quantity}</Text>
          </View>
        ))}
        <View style={s.divider} />
        <View style={s.itemRow}>
          <Text style={s.totalLbl}>Total</Text>
          <Text style={s.totalVal}>₹{order.total}</Text>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>STATUS & PAYMENT</Text>
        <View style={[s.badge, { backgroundColor: STATUS_COLOR[order.status] || '#6b7280' }]}>
          <Text style={s.badgeText}>{order.status?.toUpperCase()}</Text>
        </View>
        <Text style={s.sub}>Payment Method: {order.paymentMethod?.toUpperCase()}</Text>
      </View>

      {order.status === 'pending' && (
        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, { backgroundColor: '#065f46' }]} onPress={() => handleStatus('processing')} disabled={actionLoading}>
            <Text style={s.btnText}>✅ Accept Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, { backgroundColor: '#7f1d1d' }]} onPress={() => handleStatus('cancelled')} disabled={actionLoading}>
            <Text style={s.btnText}>❌ Reject Order</Text>
          </TouchableOpacity>
        </View>
      )}

      {order.status === 'processing' && (
        <View style={s.actions}>
          <TouchableOpacity style={[s.btn, { backgroundColor: '#1e3a5f' }]} onPress={() => handleStatus('shipped')} disabled={actionLoading}>
            <Text style={s.btnText}>📦 Mark Shipped</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090405' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, paddingTop: 60 },
  back: { color: '#f59e0b', fontWeight: '700', fontSize: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  card: { margin: 16, marginBottom: 0, backgroundColor: '#111827', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  cardTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  value: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sub: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  itemName: { color: '#e2e8f0', flex: 1 },
  itemQty: { color: '#64748b', marginHorizontal: 8 },
  itemPrice: { color: '#fff', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 8 },
  totalLbl: { color: '#94a3b8', fontWeight: '700' },
  totalVal: { color: '#f59e0b', fontWeight: '900', fontSize: 18 },
  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  actions: { padding: 16, gap: 10 },
  btn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
