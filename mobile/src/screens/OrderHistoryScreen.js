import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  SafeAreaView, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

export default function OrderHistoryScreen({ navigation }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  async function fetchOrders() {
    try {
      const data = await apiFetch('/orders?limit=50');
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch orders', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, []);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090405" />
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🔐</Text>
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptySub}>Please login to view your orders.</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090405" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      </SafeAreaView>
    );
  }

  function renderOrderCard({ item }) {
    const shortId = item._id.slice(-6).toUpperCase();
    const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const statusColor = STATUS_COLORS[item.status] || '#94a3b8';
    const itemCount = item.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderTracking', { orderId: item._id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{shortId}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.orderDate}>📅 {date}</Text>
          <Text style={styles.orderItems}>🛒 {itemCount} items</Text>
        </View>

        {/* Items Preview */}
        <View style={styles.itemsPreview}>
          {item.items?.slice(0, 3).map((orderItem, i) => (
            <Text key={i} style={styles.itemPreviewText} numberOfLines={1}>
              • {orderItem.name} ×{orderItem.quantity}
            </Text>
          ))}
          {item.items?.length > 3 && (
            <Text style={styles.moreItems}>+{item.items.length - 3} more</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>₹{(item.total || 0).toFixed(2)}</Text>
          <Text style={styles.paymentMethod}>
            💳 {(item.paymentMethod || 'cod').toUpperCase()}
          </Text>
        </View>

        <View style={styles.trackRow}>
          <Text style={styles.trackText}>View Details →</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090405" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: 50 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySub}>Your order history will appear here.</Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.actionBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrderCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#ef4444"
            />
          }
        />
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 14,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#160d10',
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2e1417',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontWeight: '900',
    fontSize: 11,
  },
  orderInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
  },
  orderDate: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  orderItems: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  itemsPreview: {
    marginBottom: 12,
  },
  itemPreviewText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  moreItems: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#2e1417',
  },
  orderTotal: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 20,
  },
  paymentMethod: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 12,
  },
  trackRow: {
    alignItems: 'flex-end',
    marginTop: 10,
  },
  trackText: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 13,
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
