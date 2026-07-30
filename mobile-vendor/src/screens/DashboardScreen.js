import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAnalytics, getOrders, updateOrder } from '../api/vendor';

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

export default function DashboardScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const [an, od] = await Promise.all([getAnalytics(), getOrders('pending')]);
      setAnalytics(an.data);
      setPendingOrders(od.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { loadData(); const t = setInterval(loadData, 30000); return () => clearInterval(t); }, [loadData]);

  async function handleOrderAction(orderId, status) {
    setActionLoading(prev => ({ ...prev, [orderId]: true }));
    try {
      await updateOrder(orderId, status);
      await loadData();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setActionLoading(prev => ({ ...prev, [orderId]: false })); }
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#f59e0b" /></View>;

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor="#f59e0b" />}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>🏪 {user?.name}</Text>
          <Text style={s.sub}>Vendor Dashboard</Text>
        </View>
        <TouchableOpacity onPress={signOut}><Text style={s.logout}>Logout</Text></TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard label="Today Orders" value={analytics?.today?.orders || 0} />
        <StatCard label="Today Revenue" value={`₹${analytics?.today?.revenue || 0}`} />
        <StatCard label="This Week" value={`₹${analytics?.week?.revenue || 0}`} />
      </View>

      {/* Low Stock Alert */}
      {(analytics?.lowStockProducts?.length > 0) && (
        <TouchableOpacity style={s.alertBanner} onPress={() => navigation.navigate('Inventory')}>
          <Text style={s.alertText}>⚠️ {analytics.lowStockProducts.length} products low on stock! Tap to view →</Text>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={s.quickRow}>
        <TouchableOpacity style={[s.quickBtn, { backgroundColor: '#f59e0b' }]} onPress={() => navigation.navigate('AddProduct')}>
          <Text style={s.quickText}>+ Add Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.quickBtn, { backgroundColor: '#1e293b' }]} onPress={() => navigation.navigate('Orders')}>
          <Text style={[s.quickText, { color: '#fff' }]}>📦 All Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Pending Orders */}
      <Text style={s.sectionTitle}>⏳ Pending Orders ({pendingOrders.length})</Text>
      {pendingOrders.length === 0 ? (
        <View style={s.empty}><Text style={s.emptyText}>No pending orders 🎉</Text></View>
      ) : (
        pendingOrders.map(order => (
          <View key={order._id} style={s.orderCard}>
            <View style={s.orderTop}>
              <Text style={s.orderId}>#{order._id?.slice(-6).toUpperCase()}</Text>
              <Text style={s.orderAmt}>₹{order.total}</Text>
            </View>
            <Text style={s.customer}>{order.customerName}</Text>
            <Text style={s.items}>{order.items?.length} items • {order.paymentMethod?.toUpperCase()}</Text>
            <View style={s.actionRow}>
              <TouchableOpacity
                style={[s.acceptBtn, actionLoading[order._id] && s.disabled]}
                onPress={() => handleOrderAction(order._id, 'processing')}
                disabled={!!actionLoading[order._id]}
              >
                <Text style={s.acceptText}>✅ Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.rejectBtn, actionLoading[order._id] && s.disabled]}
                onPress={() => handleOrderAction(order._id, 'cancelled')}
                disabled={!!actionLoading[order._id]}
              >
                <Text style={s.rejectText}>❌ Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* Top Products */}
      {analytics?.topProducts?.length > 0 && (
        <>
          <Text style={s.sectionTitle}>🏆 Top Products</Text>
          {analytics.topProducts.map((p, i) => (
            <View key={i} style={s.topCard}>
              <Text style={s.topRank}>#{i + 1}</Text>
              <Text style={s.topName} numberOfLines={1}>{p.name}</Text>
              <Text style={s.topSold}>{p.qty} sold</Text>
              <Text style={s.topRev}>₹{p.revenue}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }) {
  return (
    <View style={s.stat}>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090405' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  greeting: { fontSize: 18, fontWeight: '800', color: '#fff' },
  sub: { color: '#f59e0b', fontWeight: '700', fontSize: 12, marginTop: 2 },
  logout: { color: '#ef4444', fontWeight: '700' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  stat: { flex: 1, backgroundColor: '#111827', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  statVal: { color: '#fff', fontSize: 18, fontWeight: '900' },
  statLbl: { color: '#64748b', fontSize: 10, textAlign: 'center', marginTop: 4 },
  alertBanner: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#78350f', borderRadius: 10, padding: 12 },
  alertText: { color: '#fef3c7', fontWeight: '700', fontSize: 13 },
  quickRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  quickBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  quickText: { color: '#000', fontWeight: '800', fontSize: 14 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 10 },
  empty: { marginHorizontal: 16, backgroundColor: '#111827', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  emptyText: { color: '#94a3b8' },
  orderCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { color: '#fff', fontWeight: '800', fontSize: 16 },
  orderAmt: { color: '#f59e0b', fontWeight: '800', fontSize: 16 },
  customer: { color: '#e2e8f0', fontSize: 13, marginBottom: 2 },
  items: { color: '#64748b', fontSize: 12, marginBottom: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  acceptBtn: { flex: 1, backgroundColor: '#065f46', borderRadius: 10, padding: 12, alignItems: 'center' },
  acceptText: { color: '#fff', fontWeight: '700' },
  rejectBtn: { flex: 1, backgroundColor: '#7f1d1d', borderRadius: 10, padding: 12, alignItems: 'center' },
  rejectText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  topCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#111827', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  topRank: { color: '#f59e0b', fontWeight: '900', width: 28 },
  topName: { flex: 1, color: '#e2e8f0', fontSize: 13 },
  topSold: { color: '#64748b', fontSize: 12, marginRight: 12 },
  topRev: { color: '#10b981', fontWeight: '700' },
});
