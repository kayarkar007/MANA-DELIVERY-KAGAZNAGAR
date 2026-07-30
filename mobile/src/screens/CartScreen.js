import React, { useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

export default function CartScreen({ navigation }) {
  const { cart, updateQuantity, clearCart, cartTotal } = useCart();
  const { user } = useAuth();
  const [placing, setPlacing] = useState(false);

  const deliveryFee = 30;
  const platformFee = 5;
  const tax = cartTotal * 0.05;
  const grandTotal = cartTotal + deliveryFee + platformFee + tax;

  async function handlePlaceOrder() {
    if (!user) {
      Alert.alert('Login Required', 'Please login to place an order.', [
        { text: 'Login', onPress: () => navigation.navigate('Login') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    if (cart.length === 0) return;

    setPlacing(true);
    try {
      const orderPayload = {
        type: 'product',
        items: cart.map((item) => ({
          product: item._id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        customerName: user.name || 'Customer',
        customerPhone: user.phone || '9876543210',
        address: user.address || 'Kagaznagar Town',
        latitude: 19.3316,
        longitude: 79.4831,
        paymentMethod: 'cod',
      };


      const res = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload),
      });

      if (res.success && res.order) {
        clearCart();
        Alert.alert('Order Placed! 🎉', `Order #${res.order._id.slice(-6)} confirmed.`);
        navigation.navigate('OrderTracking', { orderId: res.order._id });
      }
    } catch (e) {
      Alert.alert('Order Error', e.message || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  }

  if (cart.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Your Basket is Empty</Text>
        <Text style={styles.emptySub}>Add fresh groceries or medicines to get started.</Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.browseButtonText}>Browse Products</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={cart}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.cartRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
            </View>

            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item._id, -1)}
              >
                <Text style={styles.qtyText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyVal}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => updateQuantity(item._id, 1)}
              >
                <Text style={styles.qtyText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.billCard}>
            <Text style={styles.billHeader}>Bill Details</Text>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billVal}>₹{cartTotal.toFixed(2)}</Text>
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
              <Text style={styles.billLabel}>Taxes (5%)</Text>
              <Text style={styles.billVal}>₹{tax.toFixed(2)}</Text>
            </View>

            <View style={[styles.billRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalVal}>₹{grandTotal.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.checkoutButtonText}>
                  Place Order (COD) • ₹{grandTotal.toFixed(0)} →
                </Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090405',
  },
  cartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  itemPrice: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 15,
    marginTop: 4,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  qtyText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  qtyVal: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
    paddingHorizontal: 8,
  },
  billCard: {
    margin: 16,
    backgroundColor: '#160d10',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2e1417',
  },
  billHeader: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
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
    marginTop: 12,
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
  checkoutButton: {
    marginTop: 20,
    backgroundColor: '#ef4444',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#090405',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
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
  browseButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  browseButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
});
