import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { getRiders } from '../api/admin';

export default function RidersScreen({ navigation }) {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await getRiders();
      setRiders(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.avatar}><Text style={s.avatarText}>🛵</Text></View>
        <View style={s.info}>
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.phone}>📞 {item.phone || 'No phone'}</Text>
        </View>
        <View style={[s.dutyBadge, { backgroundColor: item.isOnDuty ? '#065f46' : '#1e293b' }]}>
          <Text style={[s.dutyText, { color: item.isOnDuty ? '#10b981' : '#64748b' }]}>
            {item.isOnDuty ? '🟢 On Duty' : '⚪ Offline'}
          </Text>
        </View>
      </View>
      <View style={s.meta}>
        <Text style={s.sub}>Duty Status: {item.dutyStatus || 'offline'}</Text>
        <Text style={s.sub}>Wallet: ₹{item.walletBalance || 0}</Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Riders ({riders.length})</Text>
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>
      ) : (
        <FlatList
          data={riders}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#6366f1" />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.empty}>No riders registered yet</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, paddingTop: 60 },
  back: { color: '#6366f1', fontWeight: '700', fontSize: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 20 },
  info: { flex: 1 },
  name: { color: '#fff', fontWeight: '700', fontSize: 15 },
  phone: { color: '#64748b', fontSize: 12, marginTop: 2 },
  dutyBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  dutyText: { fontWeight: '800', fontSize: 11 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1e293b', paddingTop: 8 },
  sub: { color: '#94a3b8', fontSize: 12 },
  empty: { color: '#475569', textAlign: 'center', padding: 32 },
});
