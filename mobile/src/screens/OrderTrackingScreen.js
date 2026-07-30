import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  SafeAreaView, ScrollView, StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', emoji: '📝' },
  { key: 'confirmed', label: 'Confirmed', emoji: '✅' },
  { key: 'processing', label: 'Preparing', emoji: '👨‍🍳' },
  { key: 'shipped', label: 'Out for Delivery', emoji: '🛵' },
  { key: 'delivered', label: 'Delivered', emoji: '📦' },
];

function getStepIndex(status) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function OrderTrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchOrder();
    // Poll every 15 seconds for live updates
    intervalRef.current = setInterval(fetchOrder, 15000);
    return () => clearInterval(intervalRef.current);
  }, [orderId]);

  async function fetchOrder() {
    try {
      const data = await apiFetch(`/orders/${orderId}`);
      if (data.success && data.data) {
        setOrder(data.data);
        setError('');
        // Stop polling once delivered or cancelled
        if (['delivered', 'cancelled'].includes(data.data.status)) {
          clearInterval(intervalRef.current);
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090405" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Loading order...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#090405" />
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Couldn't load order</Text>
          <Text style={styles.errorSub}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchOrder}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const shortId = order._id.slice(-6).toUpperCase();
  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090405" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{shortId}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchOrder}
            tintColor="#ef4444"
          />
        }
      >
        {/* Status Badge */}
        <View style={styles.statusBadgeRow}>
          <View
            style={[
              styles.statusBadge,
              isCancelled ? styles.cancelledBadge : styles.activeBadge,
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {isCancelled ? '❌ Cancelled' : `${STATUS_STEPS[currentStep]?.emoji} ${STATUS_STEPS[currentStep]?.label}`}
            </Text>
          </View>
        </View>

        {/* Stepper */}
        {!isCancelled && (
          <View style={styles.stepperCard}>
            {STATUS_STEPS.map((step, i) => {
              const isCompleted = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <View key={step.key} style={styles.stepRow}>
                  {/* Dot + Line */}
                  <View style={styles.stepIndicator}>
                    <View
                      style={[
                        styles.stepDot,
                        isCompleted && styles.stepDotCompleted,
                        isCurrent && styles.stepDotCurrent,
                      ]}
                    >
                      {isCompleted && <Text style={styles.stepCheck}>✓</Text>}
                    </View>
                    {i < STATUS_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          isCompleted && styles.stepLineCompleted,
                        ]}
                      />
                    )}
                  </View>
                  {/* Label */}
                  <View style={styles.stepContent}>
                    <Text
                      style={[
                        styles.stepLabel,
                        isCompleted && styles.stepLabelCompleted,
                        isCurrent && styles.stepLabelCurrent,
                      ]}
                    >
                      {step.emoji} {step.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Order Details Card */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>

          {order.items?.map((item, i) => (
            <View key={i} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.name} × {item.quantity}
              </Text>
              <Text style={styles.itemPrice}>
                ₹{(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billVal}>₹{(order.subtotal || 0).toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billVal}>₹{(order.deliveryFee || 30).toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Tax</Text>
            <Text style={styles.billVal}>₹{(order.tax || 0).toFixed(2)}</Text>
          </View>
          {order.discountAmount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Discount</Text>
              <Text style={[styles.billVal, { color: '#22c55e' }]}>
                -₹{order.discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>₹{(order.total || 0).toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>📍</Text>
            <Text style={styles.infoText}>{order.address || 'Kagaznagar'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>👤</Text>
            <Text style={styles.infoText}>{order.customerName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>📞</Text>
            <Text style={styles.infoText}>{order.customerPhone}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoEmoji}>💳</Text>
            <Text style={styles.infoText}>
              {(order.paymentMethod || 'cod').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Delivery OTP */}
        {order.deliveryOtp && !isCancelled && order.status !== 'delivered' && (
          <View style={styles.otpCard}>
            <Text style={styles.otpTitle}>🔐 Delivery OTP</Text>
            <Text style={styles.otpCode}>{order.deliveryOtp}</Text>
            <Text style={styles.otpHint}>
              Share this OTP with the delivery person to confirm delivery.
            </Text>
          </View>
        )}
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
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '600',
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 20,
  },
  errorSub: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
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
  scrollContent: {
    paddingBottom: 40,
  },
  statusBadgeRow: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeBadge: {
    backgroundColor: '#14532d',
  },
  cancelledBadge: {
    backgroundColor: '#7f1d1d',
  },
  statusBadgeText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  stepperCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#160d10',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2e1417',
  },
  stepRow: {
    flexDirection: 'row',
    minHeight: 52,
  },
  stepIndicator: {
    alignItems: 'center',
    width: 32,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
  },
  stepDotCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  stepDotCurrent: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  stepCheck: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#334155',
    marginVertical: 2,
  },
  stepLineCompleted: {
    backgroundColor: '#22c55e',
  },
  stepContent: {
    flex: 1,
    paddingLeft: 14,
    paddingBottom: 12,
    justifyContent: 'center',
  },
  stepLabel: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 14,
  },
  stepLabelCompleted: {
    color: '#94a3b8',
  },
  stepLabelCurrent: {
    color: '#ffffff',
    fontWeight: '900',
  },
  detailCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#160d10',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2e1417',
  },
  sectionTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 14,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  itemPrice: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#2e1417',
    marginVertical: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  billVal: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2e1417',
  },
  totalLabel: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  totalVal: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoEmoji: {
    fontSize: 18,
  },
  infoText: {
    color: '#cbd5e1',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  otpCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1a2332',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    alignItems: 'center',
  },
  otpTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 10,
  },
  otpCode: {
    color: '#38bdf8',
    fontWeight: '900',
    fontSize: 36,
    letterSpacing: 10,
  },
  otpHint: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
  },
});
