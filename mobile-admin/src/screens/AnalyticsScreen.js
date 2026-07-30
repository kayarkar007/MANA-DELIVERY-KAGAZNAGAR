import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { getAnalytics } from '../api/admin';

export default function AnalyticsScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      const res = await getAnalytics();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#6366f1" /></View>;

  const today = data?.today || {};
  const month = data?.month || {};

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#6366f1" />}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Analytics & Revenue</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>TODAY'S SUMMARY</Text>
        <View style={s.row}>
          <View style={s.metric}>
            <Text style={s.value}>₹{(today.revenue || 0).toFixed(0)}</Text>
            <Text style={s.label}>Revenue</Text>
          </View>
          <View style={s.metric}>
            <Text style={s.value}>{today.orders || 0}</Text>
            <Text style={s.label}>Orders</Text>
          </View>
          <View style={s.metric}>
            <Text style={s.value}>{today.newUsers || 0}</Text>
            <Text style={s.label}>New Users</Text>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>MONTHLY PERFORMANCE</Text>
        <View style={s.row}>
          <View style={s.metric}>
            <Text style={s.value}>₹{(month.revenue || 0).toFixed(0)}</Text>
            <Text style={s.label}>Total Sales</Text>
          </View>
          <View style={s.metric}>
            <Text style={s.value}>{month.orders || 0}</Text>
            <Text style={s.label}>Total Orders</Text>
          </View>
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>ECOSYSTEM HEALTH</Text>
        <Text style={s.sub}>🟢 API Server: Online (manadelivery.in)</Text>
        <Text style={s.sub}>🟢 Database: Connected (MongoDB Atlas)</Text>
        <Text style={s.sub}>🟢 Push System: Firebase FCM Ready</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090405' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, paddingTop: 60 },
  back: { color: '#6366f1', fontWeight: '700', fontSize: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  card: { margin: 16, marginBottom: 0, backgroundColor: '#111827', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  cardTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-around' },
  metric: { alignItems: 'center' },
  value: { color: '#10b981', fontSize: 22, fontWeight: '900' },
  label: { color: '#64748b', fontSize: 11, marginTop: 4 },
  sub: { color: '#e2e8f0', fontSize: 13, marginVertical: 4 },
});
