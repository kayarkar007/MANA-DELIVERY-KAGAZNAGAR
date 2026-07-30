import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { getReviews } from '../api/admin';

export default function ReviewsScreen({ navigation }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await getReviews();
      setReviews(res.data || []);
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
        <Text style={s.stars}>{'⭐'.repeat(item.rating || 5)}</Text>
        <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Text>
      </View>
      <Text style={s.comment}>{item.comment || 'No comment provided'}</Text>
      <Text style={s.user}>By: {item.userName || 'Customer'}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Customer Reviews</Text>
      </View>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#8b5cf6" />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.empty}>No reviews submitted yet</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, paddingTop: 60 },
  back: { color: '#8b5cf6', fontWeight: '700', fontSize: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#111827', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#1e293b' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  stars: { fontSize: 14 },
  date: { color: '#64748b', fontSize: 11 },
  comment: { color: '#e2e8f0', fontSize: 13, marginBottom: 6 },
  user: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  empty: { color: '#475569', textAlign: 'center', padding: 32 },
});
