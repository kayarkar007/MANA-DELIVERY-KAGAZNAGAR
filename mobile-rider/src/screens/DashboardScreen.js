import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator, AppState,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getActiveOrders, shiftAction, getShiftInfo } from '../api/rider';

const STATUS_COLOR = {
  assigned: '#f59e0b',
  accepted: '#3b82f6',
  picked_up: '#8b5cf6',
  out_for_delivery: '#f97316',
  delivered: '#10b981',
};

export default function DashboardScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ completedToday: 0, earningsToday: 0 });
  const [shiftInfo, setShiftInfo] = useState(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shiftLoading, setShiftLoading] = useState(false);
  const pollRef = useRef(null);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [ordersData, shiftData] = await Promise.all([
        getActiveOrders(true),
        getShiftInfo(),
      ]);
      setOrders(ordersData.data || []);
      setStats(ordersData.stats || {});
      setShiftInfo(shiftData.data);
      setIsOnDuty(shiftData.data?.rider?.isOnDuty || false);
    } catch (e) {
      console.error('Dashboard load failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Poll every 30 seconds for new orders
    pollRef.current = setInterval(() => loadData(), 30000);
    return () => clearInterval(pollRef.current);
  }, [loadData]);

  async function handleDutyToggle() {
    setShiftLoading(true);
    try {
      const action = isOnDuty ? 'end' : 'start';
      await shiftAction(action);
      setIsOnDuty(!isOnDuty);
      await loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setShiftLoading(false);
    }
  }

  async function handleBreak() {
    const isOnBreak = shiftInfo?.activeShift?.status === 'on_break';
    setShiftLoading(true);
    try {
      await shiftAction(isOnBreak ? 'break_end' : 'break_start');
      await loadData();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setShiftLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  const isOnBreak = shiftInfo?.activeShift?.status === 'on_break';

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#ef4444" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>👋 Hello, {user?.name?.split(' ')[0]}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: isOnDuty ? '#10b981' : '#475569' }]} />
            <Text style={styles.statusText}>{isOnDuty ? (isOnBreak ? 'On Break' : 'On Duty') : 'Offline'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.logoutBtn}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Today Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.completedToday || 0}</Text>
          <Text style={styles.statLabel}>Deliveries Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>₹{stats.earningsToday || 0}</Text>
          <Text style={styles.statLabel}>Earnings Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Active Orders</Text>
        </View>
      </View>

      {/* Duty Controls & Smart Route */}
      <View style={styles.dutyRow}>
        <TouchableOpacity
          style={[styles.dutyBtn, isOnDuty ? styles.dutyBtnOff : styles.dutyBtnOn]}
          onPress={handleDutyToggle}
          disabled={shiftLoading}
        >
          {shiftLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.dutyBtnText}>{isOnDuty ? '⏹ End Duty' : '▶ Start Duty'}</Text>
          )}
        </TouchableOpacity>
        {isOnDuty && (
          <TouchableOpacity style={styles.breakBtn} onPress={handleBreak} disabled={shiftLoading}>
            <Text style={styles.breakBtnText}>{isOnBreak ? '▶ Resume' : '☕ Break'}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Smart Route Button (if active orders exist) */}
      {orders.length > 0 && (
        <TouchableOpacity
          style={styles.routeBanner}
          onPress={() => navigation.navigate('SmartRoute')}
        >
          <Text style={styles.routeBannerText}>🗺️ View Shortest Route & Fuel Saver ({orders.length} orders) →</Text>
        </TouchableOpacity>
      )}

      {/* Active Orders */}
      <Text style={styles.sectionTitle}>Active Orders ({orders.length})</Text>
      {orders.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>🎉 No active orders right now</Text>
          <Text style={styles.emptySubText}>Pull to refresh</Text>
        </View>
      ) : (
        orders.map((order) => (
          <TouchableOpacity
            key={order._id}
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { order })}
          >
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{order._id?.slice(-6).toUpperCase()}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLOR[order.deliveryStatus] || '#6b7280' }]}>
                <Text style={styles.badgeText}>{order.deliveryStatus?.replace(/_/g, ' ').toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.customerName}>{order.customerName}</Text>
            <Text style={styles.address} numberOfLines={1}>📍 {order.address}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.amount}>₹{order.total}</Text>
              <Text style={styles.payment}>{order.paymentMethod?.toUpperCase()}</Text>
              <Text style={styles.viewBtn}>View →</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090405' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  greeting: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { color: '#94a3b8', fontSize: 13 },
  logoutBtn: { color: '#ef4444', fontWeight: '700' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#111827', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  statValue: { fontSize: 22, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'center' },
  dutyRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  dutyBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  dutyBtnOn: { backgroundColor: '#10b981' },
  dutyBtnOff: { backgroundColor: '#ef4444' },
  dutyBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  breakBtn: { flex: 0.5, backgroundColor: '#f59e0b', borderRadius: 12, padding: 16, alignItems: 'center' },
  breakBtnText: { color: '#fff', fontWeight: '800' },
  routeBanner: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#065f46', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#10b981' },
  routeBannerText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  sectionTitle: { color: '#94a3b8', fontWeight: '700', fontSize: 12, letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  emptyCard: { margin: 16, backgroundColor: '#111827', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  emptySubText: { color: '#475569', marginTop: 8 },
  orderCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderId: { color: '#fff', fontWeight: '800', fontSize: 16 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  customerName: { color: '#e2e8f0', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  address: { color: '#64748b', fontSize: 12, marginBottom: 12 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amount: { color: '#fff', fontWeight: '800', fontSize: 16 },
  payment: { color: '#f59e0b', fontSize: 11, fontWeight: '700' },
  viewBtn: { color: '#ef4444', fontWeight: '700' },
});
