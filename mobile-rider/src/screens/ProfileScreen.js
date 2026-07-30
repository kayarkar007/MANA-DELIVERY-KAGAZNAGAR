import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>🛵 Delivery Rider</Text>
      </View>

      <View style={styles.card}>
        <InfoRow label="Email" value={user?.email || '—'} />
        <InfoRow label="Phone" value={user?.phone || '—'} />
        <InfoRow label="Role" value={user?.role?.toUpperCase() || '—'} />
        <InfoRow label="Account ID" value={user?.id?.slice(-8) || '—'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>App Info</Text>
        <InfoRow label="App" value="Mana Delivery Rider" />
        <InfoRow label="Version" value="1.0.0" />
        <InfoRow label="Server" value="manadelivery.in" />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  name: { color: '#fff', fontSize: 22, fontWeight: '800' },
  role: { color: '#ef4444', fontWeight: '700', marginTop: 4 },
  card: { margin: 16, marginBottom: 0, backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  cardTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  rowLabel: { color: '#64748b', fontSize: 14 },
  rowValue: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  logoutBtn: { margin: 16, marginTop: 24, backgroundColor: '#1e293b', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 16 },
});
