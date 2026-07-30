import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, ScrollView, StatusBar, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [orderStats, setOrderStats] = useState({ total: 0, pending: 0, delivered: 0 });

  async function fetchProfileData() {
    try {
      // Fetch wallet balance
      const walletData = await apiFetch('/wallet');
      if (walletData.success) {
        setWalletBalance(walletData.balance || 0);
      }
    } catch (e) {
      console.error('Wallet fetch failed', e);
    }

    try {
      // Fetch order stats
      const ordersData = await apiFetch('/orders?limit=100');
      if (ordersData.success && ordersData.data) {
        const orders = ordersData.data;
        setOrderStats({
          total: orders.length,
          pending: orders.filter((o) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length,
          delivered: orders.filter((o) => o.status === 'delivered').length,
        });
      }
    } catch (e) {
      console.error('Orders fetch failed', e);
    }
  }

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        },
      },
    ]);
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090405" />
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyTitle}>Not Logged In</Text>
          <Text style={styles.emptySub}>Login to manage your profile and orders.</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.actionBtnText}>Login Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090405" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.userName}>{user.name || 'Customer'}</Text>
          <Text style={styles.userPhone}>📱 +91 {user.phone || 'Not set'}</Text>
          {user.email && <Text style={styles.userEmail}>✉️ {user.email}</Text>}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === 'admin' ? '👑 Admin' : user.role === 'rider' ? '🛵 Rider' : '🛒 Customer'}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{orderStats.total}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{orderStats.pending}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: '#22c55e' }]}>{orderStats.delivered}</Text>
            <Text style={styles.statLabel}>Delivered</Text>
          </View>
        </View>

        {/* Wallet Card */}
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletTitle}>💰 Wallet Balance</Text>
            <Text style={styles.walletAmount}>₹{walletBalance.toFixed(2)}</Text>
          </View>
          <Text style={styles.walletHint}>
            Use wallet balance during checkout for instant payments.
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('OrderHistory')}
          >
            <Text style={styles.menuEmoji}>📋</Text>
            <Text style={styles.menuText}>My Orders</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuEmoji}>📍</Text>
            <Text style={styles.menuText}>Saved Addresses</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuEmoji}>🔔</Text>
            <Text style={styles.menuText}>Notifications</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuEmoji}>❤️</Text>
            <Text style={styles.menuText}>Wishlist</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuEmoji}>🎟️</Text>
            <Text style={styles.menuText}>Referral Code</Text>
            <Text style={styles.menuValue}>{user.referralCode || '—'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuEmoji}>🆘</Text>
            <Text style={styles.menuText}>Help & Support</Text>
            <Text style={styles.menuArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfoCard}>
          <Text style={styles.appInfoTitle}>🛵 Mana Delivery</Text>
          <Text style={styles.appInfoSub}>Kagaznagar Express Delivery</Text>
          <Text style={styles.appInfoVersion}>Version 1.2.0</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090405',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 32,
  },
  userName: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 24,
    marginBottom: 6,
  },
  userPhone: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 14,
  },
  userEmail: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 4,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  roleText: {
    color: '#94a3b8',
    fontWeight: '800',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#160d10',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2e1417',
  },
  statValue: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 28,
  },
  statLabel: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 4,
  },
  walletCard: {
    marginHorizontal: 16,
    backgroundColor: '#14210e',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1a3a0e',
    marginBottom: 16,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walletTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  walletAmount: {
    color: '#22c55e',
    fontWeight: '900',
    fontSize: 24,
  },
  walletHint: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  menuSection: {
    marginHorizontal: 16,
    backgroundColor: '#160d10',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#2e1417',
    overflow: 'hidden',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  menuEmoji: {
    fontSize: 18,
    marginRight: 14,
  },
  menuText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
    flex: 1,
  },
  menuArrow: {
    color: '#64748b',
    fontWeight: '900',
    fontSize: 16,
  },
  menuValue: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 13,
  },
  appInfoCard: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  appInfoTitle: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 16,
  },
  appInfoSub: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 4,
  },
  appInfoVersion: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 11,
    marginTop: 6,
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 15,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  emptySub: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
});
