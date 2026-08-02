import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { COLORS, SHADOWS } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout, setUser } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadProfileData() {
    if (!user) return;
    setLoading(true);
    try {
      const [walletRes, ordersRes] = await Promise.allSettled([
        apiFetch('/wallet'),
        apiFetch('/orders'),
      ]);
      if (walletRes.status === 'fulfilled') {
        setWalletBalance(walletRes.value?.balance || 0);
      }
      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value?.data || ordersRes.value?.orders || [];
        setOrderCount(Array.isArray(orders) ? orders.length : 0);
      }
    } catch (e) {
      console.warn('Profile data load failed', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfileData();
    if (user) {
      setEditName(user.name || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  async function saveProfile() {
    if (!editName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'UPDATE_PROFILE',
          name: editName.trim(),
          phone: editPhone.trim(),
        }),
      });
      if (res?.success && res?.data) {
        // Update context with new data if setUser is available
        if (setUser) setUser({ ...user, name: res.data.name, phone: res.data.phone });
      }
      setEditMode(false);
      Alert.alert('Updated!', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  }

  const activeUser = user;

  const MenuRow = ({ icon, label, badge, color, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.menuIconBg, color && { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color || COLORS.text} />
      </View>
      <Text style={styles.menuItemText}>{label}</Text>
      {badge != null && badge > 0 && (
        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>{badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={COLORS.textDark} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
        {user && (
          <TouchableOpacity onPress={() => setEditMode(!editMode)} style={styles.editBtn}>
            <Feather name={editMode ? "x" : "edit-2"} size={17} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {!user ? (
        <View style={styles.guestView}>
          <Ionicons name="person-circle-outline" size={80} color={COLORS.primary} />
          <Text style={styles.guestTitle}>Welcome to Mana Delivery</Text>
          <Text style={styles.guestSub}>
            Log in to manage orders, view wallet balance, and save delivery addresses.
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginBtnText}>Log In / Sign Up</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitial}>
                {activeUser.name ? activeUser.name[0].toUpperCase() : 'U'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              {editMode ? (
                <>
                  <TextInput
                    style={styles.editInput}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Full Name"
                    placeholderTextColor={COLORS.textDark}
                  />
                  <TextInput
                    style={[styles.editInput, { marginTop: 6 }]}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="Phone Number"
                    placeholderTextColor={COLORS.textDark}
                    keyboardType="phone-pad"
                  />
                  <TouchableOpacity style={styles.saveProfileBtn} onPress={saveProfile} disabled={saving}>
                    {saving ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Text style={styles.saveProfileBtnTxt}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.userName}>{activeUser.name || 'Mana Customer'}</Text>
                  <Text style={styles.userEmail}>{activeUser.email || activeUser.phone}</Text>
                  {activeUser.phone && <Text style={styles.userPhone}>📞 {activeUser.phone}</Text>}
                  <View style={styles.verifiedRow}>
                    <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                    <Text style={styles.verifiedText}>Verified Customer • Kagaznagar</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Wallet Card */}
          <TouchableOpacity style={styles.walletCard} onPress={() => navigation.navigate('Wallet')} activeOpacity={0.88}>
            <View style={styles.walletLeft}>
              <View style={styles.walletIconBg}>
                <Ionicons name="wallet" size={20} color={COLORS.gold} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.walletTitle}>MANA WALLET</Text>
                <Text style={styles.walletAmount}>₹{walletBalance.toFixed(2)}</Text>
                <Text style={styles.walletSub}>Tap to view transactions & top up</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gold} />
          </TouchableOpacity>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{orderCount}</Text>
              <Text style={styles.statLbl}>Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>₹{walletBalance}</Text>
              <Text style={styles.statLbl}>Wallet</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>5⭐</Text>
              <Text style={styles.statLbl}>Rating</Text>
            </View>
          </View>

          {/* Account Menu */}
          <View style={styles.menuSection}>
            <Text style={styles.menuTitle}>Account</Text>
            <MenuRow icon="receipt-outline" label="My Orders & Tracking" badge={orderCount} color={COLORS.primary} onPress={() => navigation.navigate('OrdersTab')} />
            <MenuRow icon="location-outline" label="Saved Addresses" color={COLORS.accent} onPress={() => navigation.navigate('Address')} />
            <MenuRow icon="heart-outline" label="My Wishlist" color="#EC4899" onPress={() => navigation.navigate('Wishlist')} />
            <MenuRow icon="wallet-outline" label="Wallet & Transactions" color={COLORS.gold} onPress={() => navigation.navigate('Wallet')} />
          </View>

          <View style={[styles.menuSection, { marginTop: 12 }]}>
            <Text style={styles.menuTitle}>Help</Text>
            <MenuRow icon="headset-outline" label="Help & Customer Support" color={COLORS.primary} onPress={() => navigation.navigate('Support')} />
            <MenuRow icon="information-circle-outline" label="About Mana Delivery" color={COLORS.textMuted} onPress={() => Alert.alert('About', 'Mana Delivery — Fast local delivery in Kagaznagar.\n\nVersion 1.0.0')} />
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },

  guestView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  guestTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 12 },
  guestSub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12, marginTop: 20 },
  loginBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 14 },

  scrollContent: { padding: 16, paddingBottom: 40 },

  profileCard: {
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start', ...SHADOWS.small,
  },
  avatarCircle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: COLORS.white, fontSize: 22, fontWeight: '900' },
  userInfo: { marginLeft: 14, flex: 1 },
  userName: { fontSize: 17, fontWeight: '900', color: COLORS.text },
  userEmail: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  userPhone: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  verifiedText: { fontSize: 11, color: COLORS.accent, fontWeight: '700', marginLeft: 4 },
  editInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    color: COLORS.text, fontSize: 14,
  },
  saveProfileBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 8, alignItems: 'center', marginTop: 8,
  },
  saveProfileBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 13 },

  walletCard: {
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.gold,
    padding: 16, marginTop: 14,
    flexDirection: 'row', alignItems: 'center', ...SHADOWS.small,
  },
  walletLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  walletIconBg: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.goldBg, alignItems: 'center', justifyContent: 'center',
  },
  walletTitle: { fontSize: 11, fontWeight: '900', color: COLORS.gold, letterSpacing: 0.5 },
  walletAmount: { fontSize: 24, fontWeight: '900', color: COLORS.text },
  walletSub: { fontSize: 11, color: COLORS.textMuted },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 14, alignItems: 'center', ...SHADOWS.small,
  },
  statNum: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  statLbl: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },

  menuSection: {
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 14, marginTop: 14,
  },
  menuTitle: {
    fontSize: 11, fontWeight: '800', color: COLORS.textDark,
    textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  menuIconBg: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.inputBg, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  menuItemText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.text },
  orderBadge: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, marginRight: 6,
  },
  orderBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(248,113,113,0.1)', borderWidth: 1,
    borderColor: COLORS.danger, borderRadius: 14, paddingVertical: 14, marginTop: 20,
  },
  logoutBtnText: { color: COLORS.danger, fontSize: 14, fontWeight: '900' },
});
