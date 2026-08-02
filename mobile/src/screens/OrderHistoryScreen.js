import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { COLORS, SHADOWS } from '../constants/theme';

export default function OrderHistoryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadOrders() {
    try {
      const data = await apiFetch('/orders');
      setOrders(data.orders || data.data || []);
    } catch (e) {
      console.error('Failed to load orders', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  function renderOrderItem({ item }) {
    const status = item.status || 'placed';
    const isDelivered = status === 'delivered';
    const isCancelled = status === 'cancelled';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
      >
        <View style={styles.orderHeaderRow}>
          <View style={styles.orderIconBg}>
            <Ionicons
              name={isDelivered ? 'checkmark-done-circle' : 'receipt'}
              size={20}
              color={isDelivered ? COLORS.accent : COLORS.primary}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.orderTitle}>ORDER #{item._id?.slice(-6)?.toUpperCase()}</Text>
            <Text style={styles.orderDate}>
              {new Date(item.createdAt || Date.now()).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              isDelivered ? styles.badgeSuccess : isCancelled ? styles.badgeDanger : styles.badgeActive,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isDelivered && { color: COLORS.accent },
                isCancelled && { color: COLORS.danger },
              ]}
            >
              {status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailsRow}>
          <Text style={styles.itemCountText}>
            {item.items?.length || 1} Item(s) • Kagaznagar Delivery
          </Text>
          <Text style={styles.totalPrice}>₹{item.totalAmount || item.total}</Text>
        </View>

        <View style={styles.trackBtnRow}>
          <Text style={styles.trackBtnText}>Track Status & Delivery OTP</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>

        <TouchableOpacity onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingView}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyView}>
              <Ionicons name="receipt-outline" size={56} color={COLORS.textDark} />
              <Text style={styles.emptyTitle}>No Orders Yet</Text>
              <Text style={styles.emptySub}>Your past and live delivery orders will appear here.</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.browseBtnText}>Explore Store</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  loadingView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  orderCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  orderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  orderDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  badgeSuccess: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  badgeDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCountText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.text,
  },
  trackBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  trackBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 4,
  },
  emptyView: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  browseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 16,
  },
  browseBtnText: {
    color: COLORS.white,
    fontWeight: '900',
    fontSize: 13,
  },
});
