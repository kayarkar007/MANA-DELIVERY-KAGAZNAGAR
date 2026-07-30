import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { getShiftInfo } from '../api/rider';

export default function EarningsScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      const result = await getShiftInfo();
      setData(result.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#ef4444" /></View>;
  }

  const rider = data?.rider;
  const payouts = data?.payouts || [];
  const shifts = data?.shifts || [];

  const totalEarnings = payouts.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#ef4444" />}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>💰 Total Earnings</Text>
        <Text style={styles.heroValue}>₹{totalEarnings.toFixed(0)}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{shifts.length}</Text>
          <Text style={styles.statLbl}>Total Shifts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{payouts.filter(p => p.status === 'pending').length}</Text>
          <Text style={styles.statLbl}>Pending Payouts</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{payouts.filter(p => p.status === 'paid').length}</Text>
          <Text style={styles.statLbl}>Paid</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Payouts</Text>
      {payouts.length === 0 ? (
        <Text style={styles.empty}>No payouts yet</Text>
      ) : (
        payouts.map((p) => (
          <View key={p._id} style={styles.payoutCard}>
            <View>
              <Text style={styles.payoutAmount}>₹{p.amount}</Text>
              <Text style={styles.payoutNote}>{p.note}</Text>
            </View>
            <View style={[styles.payoutBadge, p.status === 'paid' ? styles.paid : styles.pending]}>
              <Text style={styles.payoutBadgeText}>{p.status?.toUpperCase()}</Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>Shift History</Text>
      {shifts.map((s) => (
        <View key={s._id} style={styles.shiftCard}>
          <Text style={styles.shiftDate}>{new Date(s.startedAt).toLocaleDateString('en-IN')}</Text>
          <Text style={styles.shiftEarnings}>₹{s.earnings || 0}</Text>
          <Text style={styles.shiftOrders}>{s.completedOrders || 0} orders</Text>
          <Text style={[styles.shiftStatus, s.status === 'active' ? styles.active : styles.ended]}>
            {s.status}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090405' },
  heroCard: { margin: 16, marginTop: 60, backgroundColor: '#111827', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  heroLabel: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  heroValue: { color: '#fff', fontSize: 48, fontWeight: '900', marginTop: 8 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#111827', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  statVal: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLbl: { color: '#64748b', fontSize: 10, textAlign: 'center', marginTop: 4 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 16, marginVertical: 12 },
  empty: { color: '#475569', textAlign: 'center', padding: 20 },
  payoutCard: { marginHorizontal: 16, marginBottom: 10, backgroundColor: '#111827', borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  payoutAmount: { color: '#fff', fontWeight: '800', fontSize: 18 },
  payoutNote: { color: '#64748b', fontSize: 12, marginTop: 2 },
  payoutBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  paid: { backgroundColor: '#065f46' },
  pending: { backgroundColor: '#78350f' },
  payoutBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  shiftCard: { marginHorizontal: 16, marginBottom: 8, backgroundColor: '#111827', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  shiftDate: { color: '#94a3b8', fontSize: 13, flex: 1 },
  shiftEarnings: { color: '#fff', fontWeight: '800' },
  shiftOrders: { color: '#64748b', fontSize: 12, marginLeft: 12 },
  shiftStatus: { marginLeft: 12, fontSize: 11, fontWeight: '700' },
  active: { color: '#10b981' },
  ended: { color: '#475569' },
});
