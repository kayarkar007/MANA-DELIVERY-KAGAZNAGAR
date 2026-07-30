import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { getUsers } from '../api/admin';

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (pg = 1, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const params = new URLSearchParams({ page: pg, limit: 50 });
      if (search.trim()) params.set('search', search.trim());
      const result = await getUsers(params.toString());
      setUsers(pg === 1 ? (result.data || []) : prev => [...prev, ...(result.data || [])]);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [search]);

  useEffect(() => { setLoading(true); setPage(1); load(1); }, [load]);

  const ROLE_COLOR = { user: '#3b82f6', admin: '#ef4444', rider: '#10b981', vendor: '#f59e0b' };

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.avatar}><Text style={s.avatarText}>{item.name?.[0]?.toUpperCase()}</Text></View>
        <View style={s.info}>
          <Text style={s.name}>{item.name}</Text>
          <Text style={s.email}>{item.email || item.whatsapp}</Text>
        </View>
        <View style={[s.roleBadge, { backgroundColor: ROLE_COLOR[item.role] + '33', borderColor: ROLE_COLOR[item.role] }]}>
          <Text style={[s.roleText, { color: ROLE_COLOR[item.role] }]}>{item.role}</Text>
        </View>
      </View>
      <View style={s.meta}>
        <Text style={s.wallet}>Wallet: ₹{item.walletBalance || 0}</Text>
        {item.isOnDuty && <Text style={s.onDuty}>🟢 On Duty</Text>}
        <Text style={s.joined}>Joined: {new Date(item.createdAt).toLocaleDateString('en-IN')}</Text>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <Text style={s.title}>Users ({users.length})</Text>
      <TextInput style={s.search} placeholder="🔍 Search by name, email, phone..." placeholderTextColor="#475569" value={search} onChangeText={setSearch} />
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(1, true)} tintColor="#6366f1" />}
          contentContainerStyle={{ padding: 16 }}
          onEndReached={() => { if (page < totalPages) { const next = page + 1; setPage(next); load(next); } }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<Text style={s.empty}>No users found</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  title: { color: '#fff', fontSize: 20, fontWeight: '900', padding: 20, paddingTop: 60 },
  search: { marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 10, padding: 12, color: '#fff', borderWidth: 1, borderColor: '#334155', marginBottom: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  info: { flex: 1 },
  name: { color: '#fff', fontWeight: '700', fontSize: 15 },
  email: { color: '#64748b', fontSize: 12, marginTop: 2 },
  roleBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  roleText: { fontWeight: '800', fontSize: 11 },
  meta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  wallet: { color: '#10b981', fontWeight: '700', fontSize: 12 },
  onDuty: { color: '#10b981', fontSize: 12 },
  joined: { color: '#64748b', fontSize: 12 },
  empty: { color: '#475569', textAlign: 'center', padding: 32 },
});
