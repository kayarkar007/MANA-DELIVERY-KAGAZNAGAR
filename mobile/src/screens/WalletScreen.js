import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { COLORS, SHADOWS } from '../constants/theme';

export default function WalletScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadWallet() {
    try {
      const res = await apiFetch('/wallet');
      setBalance(res?.balance || 0);
      setTransactions(res?.data || []);
    } catch (e) {
      console.error('Failed to load wallet', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadWallet(); }, []);

  function txColor(type) {
    return type === 'credit' ? COLORS.accent : COLORS.danger;
  }

  function txIcon(type) {
    return type === 'credit' ? 'arrow-down-circle' : 'arrow-up-circle';
  }

  function txLabel(source) {
    const map = {
      'order_payment': 'Order Payment',
      'cashback': 'Cashback',
      'topup': 'Wallet Top-up',
      'refund': 'Refund',
      'admin': 'Admin Credit',
    };
    return map[source] || source || 'Transaction';
  }

  function renderTx({ item }) {
    const isCredit = item.type === 'credit';
    return (
      <View style={styles.txItem}>
        <View style={[styles.txIconBg, { backgroundColor: isCredit ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.12)' }]}>
          <Ionicons name={txIcon(item.type)} size={20} color={txColor(item.type)} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txLabel}>{txLabel(item.source)}</Text>
          {item.note ? <Text style={styles.txNote} numberOfLines={1}>{item.note}</Text> : null}
          <Text style={styles.txDate}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
        </View>
        <Text style={[styles.txAmount, { color: txColor(item.type) }]}>
          {isCredit ? '+' : '-'}₹{Math.abs(item.amount)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mana Wallet</Text>
        <View style={{ width: 38 }} />
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item._id}
        renderItem={renderTx}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadWallet(); }}
            tintColor={COLORS.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.walletIconBg}>
                <Ionicons name="wallet" size={24} color={COLORS.gold} />
              </View>
              <Text style={styles.balanceLabel}>MANA WALLET BALANCE</Text>
              <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
              <Text style={styles.balanceSub}>Usable for instant checkout</Text>

              {/* Topup Row */}
              <View style={styles.topupRow}>
                <TouchableOpacity
                  style={styles.topupBtn}
                  onPress={() => Alert.alert(
                    '💳 Wallet Top-up',
                    'Online top-up via Razorpay is coming soon!\n\nYou can contact support to manually add wallet balance:\n📞 +91 94943 78247',
                    [{ text: 'OK' }]
                  )}
                >
                  <Ionicons name="add-circle-outline" size={16} color={COLORS.gold} />
                  <Text style={styles.topupBtnTxt}>Top Up</Text>
                  <View style={styles.comingSoonChip}>
                    <Text style={styles.comingSoonTxt}>Soon</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* UPI QR Info */}
            <View style={styles.upiCard}>
              <Ionicons name="qr-code-outline" size={22} color={COLORS.textMuted} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.upiTitle}>Add via UPI Transfer</Text>
                <Text style={styles.upiSub}>Send to UPI ID and share screenshot with support to credit your wallet.</Text>
                <Text style={styles.upiId}>manadelivery@upi</Text>
              </View>
            </View>

            {/* Transaction Title */}
            <Text style={styles.txHeader}>Transaction History</Text>
            {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />}
          </>
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={COLORS.textDark} />
              <Text style={styles.emptyTxt}>No transactions yet.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },

  list: { paddingHorizontal: 16, paddingBottom: 40 },

  balanceCard: {
    backgroundColor: COLORS.card, borderRadius: 24,
    borderWidth: 1, borderColor: COLORS.gold,
    padding: 24, marginVertical: 16, alignItems: 'center', ...SHADOWS.medium,
  },
  walletIconBg: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.goldBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 11, fontWeight: '900', color: COLORS.gold,
    letterSpacing: 1, marginBottom: 8,
  },
  balanceAmount: { fontSize: 44, fontWeight: '900', color: COLORS.text },
  balanceSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  topupRow: { marginTop: 16, width: '100%' },
  topupBtn: {
    backgroundColor: COLORS.goldBg, borderWidth: 1, borderColor: COLORS.gold,
    borderRadius: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12, gap: 8,
  },
  topupBtnTxt: { color: COLORS.gold, fontWeight: '800', fontSize: 14 },
  comingSoonChip: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  comingSoonTxt: { color: COLORS.gold, fontSize: 10, fontWeight: '800' },

  upiCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 14, flexDirection: 'row', alignItems: 'flex-start',
    marginBottom: 20, ...SHADOWS.small,
  },
  upiTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text },
  upiSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, lineHeight: 17 },
  upiId: { color: COLORS.primary, fontWeight: '700', fontSize: 13, marginTop: 6 },

  txHeader: {
    fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12,
  },
  txItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 12, marginBottom: 10, ...SHADOWS.small,
  },
  txIconBg: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  txNote: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  txDate: { fontSize: 11, color: COLORS.textDark, marginTop: 4 },
  txAmount: { fontSize: 16, fontWeight: '900' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { color: COLORS.textMuted, fontSize: 14, marginTop: 10 },
});
