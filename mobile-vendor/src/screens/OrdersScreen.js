import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { getOrders, updateOrder } from '../api/vendor';

const STATUS_COLOR = {
  pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6',
  delivered: '#10b981', cancelled: '#6b7280',
};
const FILTERS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const result = await getOrders(filter === 'all' ? '' : filter);
      setOrders(result.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  async function handleAction(orderId, status) {
    setActionLoading(p => ({ ...p, [orderId]: true }));
    try {
      await updateOrder(orderId, status);
      await load();
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setActionLoading(p => ({ ...p, [orderId]: false })); }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}>
      <View style={s.cardTop}>
        <Text style={s.orderId}>#{item._id?.slice(-6).toUpperCase()}</Text>
        <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] || '#6b7280' }]}>
          <Text style={s.badgeText}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={s.customer}>{item.customerName}</Text>
      <Text style={s.meta}>{item.items?.length} items • ₹{item.total} • {item.paymentMethod?.toUpperCase()}</Text>
      {item.status === 'pending' && (
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.accept, actionLoading[item._id] && s.disabled]}
            onPress={() => handleAction(item._id, 'processing')}
            disabled={!!actionLoading[item._id]}
          >
            <Text style={s.actionText}>✅ Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.reject, actionLoading[item._id] && s.disabled]}
            onPress={() => handleAction(item._id, 'cancelled')}
            disabled={!!actionLoading[item._id]}
          >
            <Text style={s.actionText}>❌ Reject</Text>
          </TouchableOpacity>
        </View>
      )}
      {item.status === 'processing' && (
        <TouchableOpacity
          style={[s.shipped, actionLoading[item._id] && s.disabled]}
          onPress={() => handleAction(item._id, 'shipped')}
          disabled={!!actionLoading[item._id]}
        >
          <Text style={s.shippedText}>📦 Mark Shipped →</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Orders</Text>
      </View>
      {/* Filter chips */}
      <FlatList
        data={FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        style={s.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.filter, filter === item && s.filterActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[s.filterText, filter === item && s.filterActiveText]}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#f59e0b" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#f59e0b" />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.empty}>No orders</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  header: { padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 22, fontWeight: '900' },
  filterRow: { paddingLeft: 16, marginBottom: 4, maxHeight: 48 },
  filter: { backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  filterActive: { backgroundColor: '#f59e0b' },
  filterText: { color: '#94a3b8', fontWeight: '700', textTransform: 'capitalize' },
  filterActiveText: { color: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { color: '#fff', fontWeight: '800', fontSize: 16 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  customer: { color: '#e2e8f0', fontSize: 13, marginBottom: 4 },
  meta: { color: '#64748b', fontSize: 12, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  accept: { flex: 1, backgroundColor: '#065f46', borderRadius: 8, padding: 10, alignItems: 'center' },
  reject: { flex: 1, backgroundColor: '#7f1d1d', borderRadius: 8, padding: 10, alignItems: 'center' },
  shipped: { backgroundColor: '#1e3a5f', borderRadius: 8, padding: 10, alignItems: 'center' },
  shippedText: { color: '#fff', fontWeight: '700' },
  actionText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  empty: { color: '#475569', textAlign: 'center', padding: 32 },
});
