import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getAnalytics } from '../api/admin';

export default function DashboardScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const result = await getAnalytics();
      setData(result.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  const today = data?.today || {};
  const recentOrders = data?.recentOrders || [];

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#6366f1" />}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>⚙️ Admin Panel</Text>
          <Text style={s.sub}>Welcome, {user?.name}</Text>
        </View>
        <TouchableOpacity onPress={signOut}><Text style={s.logout}>Logout</Text></TouchableOpacity>
      </View>

      {/* Today Stats */}
      <View style={s.statsGrid}>
        <StatCard label="Orders Today" value={today.orders || 0} color="#6366f1" icon="📦" />
        <StatCard label="Revenue Today" value={`₹${(today.revenue || 0).toFixed(0)}`} color="#10b981" icon="💰" />
        <StatCard label="New Users" value={today.newUsers || 0} color="#f59e0b" icon="👤" />
        <StatCard label="Active Orders" value={recentOrders.filter(o => ['pending','processing','shipped'].includes(o.status)).length} color="#ef4444" icon="⚡" />
      </View>

      {/* Quick Links */}
      <Text style={s.sectionTitle}>QUICK ACCESS</Text>
      <View style={s.quickGrid}>
        <QuickBtn label="All Orders" icon="📦" onPress={() => navigation.navigate('Orders')} color="#6366f1" />
        <QuickBtn label="Users" icon="👥" onPress={() => navigation.navigate('Users')} color="#0ea5e9" />
        <QuickBtn label="Analytics" icon="📊" onPress={() => navigation.navigate('Analytics')} color="#10b981" />
        <QuickBtn label="Riders" icon="🛵" onPress={() => navigation.navigate('Riders')} color="#f59e0b" />
        <QuickBtn label="Promo Codes" icon="🎟" onPress={() => navigation.navigate('Promo')} color="#ec4899" />
        <QuickBtn label="Reviews" icon="⭐" onPress={() => navigation.navigate('Reviews')} color="#8b5cf6" />
      </View>

      {/* Recent Orders */}
      <Text style={s.sectionTitle}>RECENT ORDERS</Text>
      {recentOrders.map(order => (
        <TouchableOpacity key={order._id} style={s.orderCard} onPress={() => navigation.navigate('OrderDetail', { orderId: order._id })}>
          <Text style={s.orderId}>#{order._id?.slice(-6).toUpperCase()}</Text>
          <Text style={s.customerName}>{order.customerName}</Text>
          <View style={[s.badge, { backgroundColor: STATUS_COLOR[order.status] || '#6b7280' }]}>
            <Text style={s.badgeText}>{order.status?.toUpperCase()}</Text>
          </View>
          <Text style={s.amount}>₹{order.total}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

function StatCard({ label, value, color, icon }) {
  return (
    <View style={[s.stat, { borderLeftColor: color }]}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  );
}

function QuickBtn({ label, icon, onPress, color }) {
  return (
    <TouchableOpacity style={[s.quick, { borderColor: color }]} onPress={onPress}>
      <Text style={s.quickIcon}>{icon}</Text>
      <Text style={s.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090405' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  greeting: { fontSize: 18, fontWeight: '900', color: '#fff' },
  sub: { color: '#6366f1', fontWeight: '700', fontSize: 12, marginTop: 2 },
  logout: { color: '#ef4444', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10 },
  stat: { width: '47%', backgroundColor: '#111827', borderRadius: 14, padding: 16, borderLeftWidth: 3, borderWidth: 1, borderColor: '#1e293b' },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statVal: { color: '#fff', fontSize: 24, fontWeight: '900' },
  statLbl: { color: '#64748b', fontSize: 11, marginTop: 4 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 16, marginTop: 16, marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10 },
  quick: { width: '30%', backgroundColor: '#111827', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1 },
  quickIcon: { fontSize: 24, marginBottom: 6 },
  quickLabel: { color: '#e2e8f0', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  orderCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#111827', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  orderId: { color: '#fff', fontWeight: '800', flex: 1 },
  customerName: { color: '#94a3b8', fontSize: 12, flex: 1 },
  badge: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '800' },
  amount: { color: '#10b981', fontWeight: '800', marginLeft: 8 },
});
