import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { getOrders, bulkUpdateOrders } from '../api/admin';

const STATUS_COLOR = { pending: '#f59e0b', processing: '#3b82f6', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#6b7280' };
const FILTERS = ['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState([]);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (search.trim()) params.set('search', search.trim());
      const result = await getOrders(params.toString());
      setOrders(result.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filter, search]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  function toggleSelect(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  async function handleBulkUpdate(status) {
    if (!selected.length) { Alert.alert('No orders selected'); return; }
    try {
      await bulkUpdateOrders(selected, status);
      setSelected([]);
      await load();
    } catch (e) { Alert.alert('Error', e.message); }
  }

  const renderItem = ({ item }) => {
    const isSelected = selected.includes(item._id);
    return (
      <TouchableOpacity
        style={[s.card, isSelected && s.cardSelected]}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
        onLongPress={() => toggleSelect(item._id)}
      >
        <View style={s.cardRow}>
          <Text style={s.orderId}>#{item._id?.slice(-6).toUpperCase()}</Text>
          <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.status] || '#6b7280' }]}>
            <Text style={s.badgeText}>{item.status?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={s.customer}>{item.customerName}</Text>
        <View style={s.cardRow}>
          <Text style={s.amount}>₹{item.total}</Text>
          <Text style={s.method}>{item.paymentMethod?.toUpperCase()}</Text>
          <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Text>
        </View>
        {isSelected && <Text style={s.selectedMark}>✅ Selected</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>All Orders ({orders.length})</Text>
      <TextInput style={s.search} placeholder="🔍 Search orders..." placeholderTextColor="#475569" value={search} onChangeText={setSearch} />

      {/* Bulk actions */}
      {selected.length > 0 && (
        <View style={s.bulkBar}>
          <Text style={s.bulkCount}>{selected.length} selected</Text>
          <TouchableOpacity style={s.bulkBtn} onPress={() => handleBulkUpdate('processing')}><Text style={s.bulkBtnText}>Accept</Text></TouchableOpacity>
          <TouchableOpacity style={[s.bulkBtn, { backgroundColor: '#7f1d1d' }]} onPress={() => handleBulkUpdate('cancelled')}><Text style={s.bulkBtnText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setSelected([])}><Text style={s.bulkClear}>✕</Text></TouchableOpacity>
        </View>
      )}

      {/* Filter chips */}
      <FlatList
        data={FILTERS}
        horizontal showsHorizontalScrollIndicator={false}
        keyExtractor={i => i}
        style={s.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.filter, filter === item && s.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[s.filterText, filter === item && s.filterActiveText]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#6366f1" />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.empty}>No orders</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', padding: 20, paddingTop: 60 },
  search: { marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 10, padding: 12, color: '#fff', borderWidth: 1, borderColor: '#334155', marginBottom: 4 },
  filterRow: { paddingLeft: 16, maxHeight: 48, marginBottom: 4 },
  filter: { backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  filterActive: { backgroundColor: '#6366f1' },
  filterText: { color: '#94a3b8', fontWeight: '700', textTransform: 'capitalize' },
  filterActiveText: { color: '#fff' },
  bulkBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 12, marginHorizontal: 16, borderRadius: 10, gap: 8, marginBottom: 4 },
  bulkCount: { color: '#fff', fontWeight: '700', flex: 1 },
  bulkBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  bulkBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  bulkClear: { color: '#ef4444', fontWeight: '900', fontSize: 18 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  cardSelected: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { color: '#fff', fontWeight: '800', fontSize: 15 },
  badge: { borderRadius: 5, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  customer: { color: '#e2e8f0', fontSize: 13, marginBottom: 6 },
  amount: { color: '#10b981', fontWeight: '800' },
  method: { color: '#f59e0b', fontSize: 11 },
  date: { color: '#64748b', fontSize: 11 },
  selectedMark: { color: '#6366f1', fontWeight: '700', fontSize: 12, marginTop: 4 },
  empty: { color: '#475569', textAlign: 'center', padding: 32 },
});
