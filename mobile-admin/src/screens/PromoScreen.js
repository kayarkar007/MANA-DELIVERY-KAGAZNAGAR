import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, TextInput } from 'react-native';
import { getPromos, createPromo, deletePromo } from '../api/admin';

export default function PromoScreen({ navigation }) {
  const [promos, setPromos] = useState([]);
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  async function load(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await getPromos();
      setPromos(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!code.trim() || !discount.trim()) {
      Alert.alert('Error', 'Code and discount percentage are required.');
      return;
    }
    setCreating(true);
    try {
      await createPromo({
        code: code.trim().toUpperCase(),
        discountPercent: Number(discount),
        minOrderAmount: Number(minOrder) || 0,
      });
      setCode(''); setDiscount(''); setMinOrder('');
      await load();
      Alert.alert('Success', 'Promo code created!');
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deletePromo(id);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.row}>
        <Text style={s.code}>{item.code}</Text>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Text style={s.delText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
      <Text style={s.sub}>{item.discountPercent}% OFF • Min Order: ₹{item.minOrderAmount || 0}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Promo Codes</Text>
      </View>

      <View style={s.form}>
        <TextInput style={s.input} placeholder="Code (e.g. SAVE20)" placeholderTextColor="#475569" value={code} onChangeText={setCode} />
        <View style={s.rowInputs}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="Discount %" placeholderTextColor="#475569" keyboardType="numeric" value={discount} onChangeText={setDiscount} />
          <TextInput style={[s.input, { flex: 1 }]} placeholder="Min Order ₹" placeholderTextColor="#475569" keyboardType="numeric" value={minOrder} onChangeText={setMinOrder} />
        </View>
        <TouchableOpacity style={s.btn} onPress={handleCreate} disabled={creating}>
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>+ Create Promo Code</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>
      ) : (
        <FlatList
          data={promos}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#6366f1" />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.empty}>No active promo codes</Text>}
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
  form: { paddingHorizontal: 16, marginBottom: 8 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, color: '#fff', borderWidth: 1, borderColor: '#334155', marginBottom: 8 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  btn: { backgroundColor: '#ec4899', borderRadius: 10, padding: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '800' },
  card: { backgroundColor: '#111827', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1e293b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  code: { color: '#ec4899', fontWeight: '900', fontSize: 16 },
  delText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  sub: { color: '#94a3b8', fontSize: 12 },
  empty: { color: '#475569', textAlign: 'center', padding: 32 },
});
