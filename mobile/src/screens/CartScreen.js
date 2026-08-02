import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  TextInput, ScrollView, Alert, ActivityIndicator, Linking, Clipboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { getCurrentLocationAddress, KAGAZNAGAR_CENTER } from '../utils/location';
import { COLORS, SHADOWS } from '../constants/theme';

// ✅ Your UPI ID — change if needed
const UPI_ID = 'manishreddy6002@ptyes';
const UPI_NAME = 'Mana Delivery';

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { cart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user } = useAuth();

  const [address, setAddress] = useState(user?.address || 'Plot 101, Kagaznagar Main Road, 504296');
  const [userCoords, setUserCoords] = useState({
    latitude: KAGAZNAGAR_CENTER.latitude,
    longitude: KAGAZNAGAR_CENTER.longitude,
  });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  // Payment state — UPI only (no COD)
  const [utrId, setUtrId] = useState('');
  const [useWallet, setUseWallet] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [upiExpanded, setUpiExpanded] = useState(false);

  const deliveryFee = 30;
  const platformFee = 5;
  const tax = Number((cartTotal * 0.05).toFixed(2));
  const walletDiscount = useWallet && (user?.walletBalance > 0)
    ? Math.min(user.walletBalance, cartTotal + deliveryFee + platformFee + tax)
    : 0;
  const finalTotal = Math.max(0, cartTotal + deliveryFee + platformFee + tax - walletDiscount);

  // Auto-detect location on mount
  useEffect(() => {
    handleDetectLocation(true);
  }, []);

  async function handleDetectLocation(silent = false) {
    setDetectingLocation(true);
    try {
      const res = await getCurrentLocationAddress();
      if (res.success) {
        if (res.address) setAddress(res.address);
        setUserCoords({ latitude: res.latitude, longitude: res.longitude });
        setLocationDetected(true);
        if (!silent) {
          Alert.alert('📍 GPS Detected', `Location: ${res.address}`);
        }
      } else if (!silent) {
        Alert.alert('GPS Notice', res.error || 'Could not fetch GPS location.');
      }
    } catch (e) {
      if (!silent) Alert.alert('GPS Error', 'Failed to detect location.');
    } finally {
      setDetectingLocation(false);
    }
  }

  function openUpiApp() {
    const amount = finalTotal.toFixed(2);
    const upiUrl = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&cu=INR&tn=${encodeURIComponent('Mana Delivery Order')}`;
    Linking.openURL(upiUrl).catch(() => {
      Alert.alert('UPI App', 'No UPI app found. Please open your UPI app manually and pay to:\n\n' + UPI_ID);
    });
  }

  function copyUpiId() {
    Clipboard.setString(UPI_ID);
    Alert.alert('Copied! ✓', `UPI ID "${UPI_ID}" copied to clipboard.`);
  }

  async function handleCheckout() {
    if (!user) {
      Alert.alert('Login Required', 'Please login to place your order.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (cart.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart first.');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Address Required', 'Please enter a valid delivery address in Kagaznagar.');
      return;
    }

    // UPI payment validation — require UTR if total > 0 and wallet doesn't cover full
    if (finalTotal > 0 && !utrId.trim()) {
      Alert.alert(
        '⚠️ UTR ID Required',
        'Please pay via UPI and enter the 12-digit UTR / Transaction Reference ID to confirm your payment.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = cart.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.imageUrl || item.image,
        shop: item.shop || undefined,
      }));

      const payload = {
        type: 'product',
        items: orderItems,
        customerName: user.name || user.email?.split('@')[0] || 'Customer',
        customerPhone: user.phone || '9494378247',
        address: address.trim(),
        latitude: userCoords.latitude || 19.3315,
        longitude: userCoords.longitude || 79.4828,
        paymentMethod: finalTotal === 0 ? 'wallet' : 'upi',
        transactionId: utrId.trim() || undefined,
        walletUsed: walletDiscount,
        tipAmount: 0,
      };

      const res = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success || res.order || res.data) {
        clearCart();
        const createdOrder = res.order || res.data;
        navigation.navigate('CheckoutSuccess', {
          orderId: createdOrder?._id || createdOrder?.id,
          total: finalTotal,
        });
      } else {
        Alert.alert('Order Failed', res.error || 'Failed to submit order. Please try again.');
      }
    } catch (e) {
      Alert.alert('Order Error', e.message || 'Failed to submit order. Please check your network.');
    } finally {
      setSubmitting(false);
    }
  }

  function renderCartItem({ item }) {
    return (
      <View style={styles.cartCard}>
        <Image
          source={{ uri: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300' }}
          style={styles.itemImage}
        />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{item.price}{item.unit ? ` • per ${item.unit}` : ''}</Text>
          <Text style={styles.itemSubtotal}>Subtotal: ₹{item.price * item.quantity}</Text>
        </View>
        <View style={styles.qtyControl}>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, -1)}>
            <Ionicons name="remove" size={14} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyVal}>{item.quantity}</Text>
          <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, 1)}>
            <Ionicons name="add" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart ({cart.length})</Text>
        {cart.length > 0 ? (
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyView}>
          <Ionicons name="cart-outline" size={64} color={COLORS.textDark} />
          <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
          <Text style={styles.emptySub}>Explore fresh groceries and items from Kagaznagar stores.</Text>
          <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopNowBtnText}>Browse Store</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Cart Items */}
          <Text style={styles.sectionHeader}>Selected Items</Text>
          <FlatList
            data={cart}
            keyExtractor={(item) => item._id}
            renderItem={renderCartItem}
            scrollEnabled={false}
          />

          {/* Delivery Address */}
          <View style={styles.cardSection}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="location-outline" size={20} color={COLORS.primary} />
              <Text style={styles.cardHeaderTitle}>Delivery Location</Text>
              <TouchableOpacity
                style={styles.gpsDetectBtn}
                disabled={detectingLocation}
                onPress={() => handleDetectLocation(false)}
              >
                {detectingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.accent} />
                ) : (
                  <>
                    <Ionicons name="locate-outline" size={14} color={COLORS.accent} />
                    <Text style={styles.gpsDetectBtnText}>GPS Detect</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            {locationDetected && (
              <View style={styles.locationBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                <Text style={styles.locationBadgeText}>Accurate GPS Coordinates Pinned for Rider</Text>
              </View>
            )}
            <TextInput
              style={styles.addressInput}
              value={address}
              onChangeText={setAddress}
              placeholder="House/Plot no, Area, Kagaznagar 504296"
              placeholderTextColor={COLORS.textDark}
              multiline
            />
          </View>

          {/* UPI Payment Section */}
          <View style={styles.cardSection}>
            <Text style={styles.cardHeaderTitle}>💳 Payment Method</Text>

            {/* UPI Box */}
            <TouchableOpacity
              style={styles.upiHeader}
              onPress={() => setUpiExpanded(!upiExpanded)}
              activeOpacity={0.85}
            >
              <View style={styles.upiHeaderLeft}>
                <Ionicons name="qr-code-outline" size={22} color={COLORS.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.upiTitle}>Pay via UPI</Text>
                  <Text style={styles.upiSubtitle}>Google Pay, PhonePe, Paytm or any UPI app</Text>
                </View>
              </View>
              <Ionicons name={upiExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textMuted} />
            </TouchableOpacity>

            {upiExpanded && (
              <View style={styles.upiDetails}>
                {/* UPI ID */}
                <View style={styles.upiIdRow}>
                  <Text style={styles.upiIdLabel}>UPI ID:</Text>
                  <Text style={styles.upiIdValue} selectable>{UPI_ID}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={copyUpiId}>
                    <Ionicons name="copy-outline" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {/* Pay amount */}
                <View style={styles.upiAmountRow}>
                  <Text style={styles.upiAmountLabel}>Amount to pay:</Text>
                  <Text style={styles.upiAmountValue}>₹{finalTotal.toFixed(2)}</Text>
                </View>

                {/* Open UPI App Button */}
                <TouchableOpacity style={styles.openUpiBtn} onPress={openUpiApp}>
                  <Ionicons name="phone-portrait-outline" size={18} color={COLORS.white} />
                  <Text style={styles.openUpiBtnTxt}>Open UPI App to Pay ₹{finalTotal}</Text>
                </TouchableOpacity>

                {/* Instructions */}
                <View style={styles.upiInstructions}>
                  <Text style={styles.upiInstrTitle}>📋 Steps to pay:</Text>
                  <Text style={styles.upiInstrStep}>1. Tap "Open UPI App" or copy UPI ID above</Text>
                  <Text style={styles.upiInstrStep}>2. Pay ₹{finalTotal} to UPI ID: {UPI_ID}</Text>
                  <Text style={styles.upiInstrStep}>3. After payment, copy the 12-digit UTR / Ref. No.</Text>
                  <Text style={styles.upiInstrStep}>4. Paste it below and place your order</Text>
                </View>
              </View>
            )}

            {/* Razorpay Coming Soon */}
            <View style={styles.razorpayCard}>
              <Ionicons name="card-outline" size={20} color={COLORS.textDark} />
              <Text style={styles.razorpayText}>Razorpay / Card Payments</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon</Text>
              </View>
            </View>

            {/* UTR Input */}
            {finalTotal > 0 && (
              <View style={styles.utrSection}>
                <Text style={styles.utrLabel}>
                  <Ionicons name="receipt-outline" size={14} color={COLORS.text} />
                  {' '}Enter UTR / Transaction Reference ID *
                </Text>
                <TextInput
                  style={styles.utrInput}
                  value={utrId}
                  onChangeText={setUtrId}
                  placeholder="12-digit UTR number (e.g. 404532847291)"
                  placeholderTextColor={COLORS.textDark}
                  keyboardType="number-pad"
                  maxLength={20}
                />
                <Text style={styles.utrHelp}>
                  Find UTR in your UPI app under "Transaction Details" after payment
                </Text>
              </View>
            )}

            {/* Wallet Toggle */}
            {user?.walletBalance > 0 && (
              <TouchableOpacity
                style={styles.walletRow}
                onPress={() => setUseWallet(!useWallet)}
              >
                <Ionicons
                  name={useWallet ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={useWallet ? COLORS.accent : COLORS.textMuted}
                />
                <Text style={styles.walletText}>
                  Use Wallet Balance (Available: ₹{user.walletBalance})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bill Details */}
          <View style={styles.cardSection}>
            <Text style={styles.cardHeaderTitle}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billVal}>₹{cartTotal}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billVal}>₹{deliveryFee}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Platform Fee</Text>
              <Text style={styles.billVal}>₹{platformFee}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tax (5%)</Text>
              <Text style={styles.billVal}>₹{tax}</Text>
            </View>
            {walletDiscount > 0 && (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Wallet Discount</Text>
                <Text style={[styles.billVal, { color: COLORS.accent }]}>-₹{walletDiscount}</Text>
              </View>
            )}
            <View style={styles.billDivider} />
            <View style={styles.billRow}>
              <Text style={styles.finalTotalLabel}>To Pay</Text>
              <Text style={styles.finalTotalVal}>₹{finalTotal}</Text>
            </View>
            {finalTotal > 0 && (
              <View style={styles.payViaUpiNote}>
                <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
                <Text style={styles.payViaUpiNoteText}>Pay ₹{finalTotal} via UPI to {UPI_ID} then enter UTR above</Text>
              </View>
            )}
          </View>

        </ScrollView>
      )}

      {/* Bottom Bar */}
      {cart.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View>
            <Text style={styles.bottomTotalLabel}>Total Amount</Text>
            <Text style={styles.bottomTotalVal}>₹{finalTotal}</Text>
          </View>
          <TouchableOpacity
            style={[styles.checkoutBtn, submitting && { opacity: 0.7 }]}
            disabled={submitting}
            activeOpacity={0.9}
            onPress={handleCheckout}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.checkoutBtnText}>Place Order</Text>
                <Ionicons name="arrow-forward" size={18} color={COLORS.white} style={{ marginLeft: 6 }} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  clearText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
  emptyView: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 16 },
  emptySub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 },
  shopNowBtn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 },
  shopNowBtnText: { color: COLORS.white, fontWeight: '900', fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  sectionHeader: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  cartCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  itemImage: { width: 60, height: 60, borderRadius: 10, backgroundColor: '#0F172A' },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  itemPrice: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  itemSubtotal: { fontSize: 12, fontWeight: '800', color: COLORS.accent, marginTop: 4 },
  qtyControl: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: 6, paddingVertical: 4,
  },
  qtyBtn: { padding: 4 },
  qtyVal: { fontSize: 13, fontWeight: '900', color: COLORS.text, marginHorizontal: 8 },
  cardSection: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 14, marginTop: 12,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardHeaderTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, flex: 1, marginLeft: 6, marginBottom: 8 },
  gpsDetectBtn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)', borderWidth: 1, borderColor: COLORS.accent,
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
    flexDirection: 'row', alignItems: 'center',
  },
  gpsDetectBtnText: { color: COLORS.accent, fontSize: 11, fontWeight: '800', marginLeft: 4 },
  locationBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8,
  },
  locationBadgeText: { color: COLORS.accent, fontSize: 11, fontWeight: '700', marginLeft: 4 },
  addressInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 10, color: COLORS.text, fontSize: 13, padding: 10, minHeight: 60,
  },

  // UPI Payment
  upiHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.primary,
    borderRadius: 14, padding: 14, marginBottom: 10,
  },
  upiHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  upiTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  upiSubtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  upiDetails: {
    backgroundColor: COLORS.inputBg, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 12, marginBottom: 10,
  },
  upiIdRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
  },
  upiIdLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginRight: 8 },
  upiIdValue: { flex: 1, fontSize: 14, fontWeight: '900', color: COLORS.primary },
  copyBtn: { padding: 4 },
  upiAmountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  upiAmountLabel: { fontSize: 13, color: COLORS.textMuted },
  upiAmountValue: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  openUpiBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 8, marginBottom: 12,
  },
  openUpiBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  upiInstructions: {
    backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 10, padding: 12,
  },
  upiInstrTitle: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  upiInstrStep: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 17 },

  // Razorpay Coming Soon
  razorpayCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.cardBorder, padding: 12, marginBottom: 12, gap: 8, opacity: 0.7,
  },
  razorpayText: { flex: 1, fontSize: 13, fontWeight: '700', color: COLORS.textDark },
  comingSoonBadge: { backgroundColor: COLORS.gold, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  comingSoonText: { color: COLORS.background, fontSize: 10, fontWeight: '900' },

  // UTR Input
  utrSection: { marginBottom: 12 },
  utrLabel: { fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
  utrInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1.5, borderColor: COLORS.primary,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 15, fontWeight: '700', letterSpacing: 1,
  },
  utrHelp: { fontSize: 11, color: COLORS.textMuted, marginTop: 5, lineHeight: 15 },

  // Wallet
  walletRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.cardBorder },
  walletText: { fontSize: 13, color: COLORS.textMuted, marginLeft: 8, fontWeight: '600' },

  // Bill
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  billLabel: { fontSize: 13, color: COLORS.textMuted },
  billVal: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  billDivider: { height: 1, backgroundColor: COLORS.cardBorder, marginVertical: 10 },
  finalTotalLabel: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  finalTotalVal: { fontSize: 18, fontWeight: '900', color: COLORS.accent },
  payViaUpiNote: {
    flexDirection: 'row', alignItems: 'flex-start', marginTop: 10,
    backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: 8, gap: 6,
  },
  payViaUpiNoteText: { flex: 1, fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },

  // Bottom Bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.cardBorder,
    paddingHorizontal: 20, paddingTop: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    ...SHADOWS.medium,
  },
  bottomTotalLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  bottomTotalVal: { fontSize: 20, fontWeight: '900', color: COLORS.text },
  checkoutBtn: {
    backgroundColor: COLORS.accent, borderRadius: 14,
    paddingHorizontal: 22, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center',
  },
  checkoutBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '900' },
});
