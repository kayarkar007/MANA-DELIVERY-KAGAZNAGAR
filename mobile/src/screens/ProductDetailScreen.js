import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Image, TouchableOpacity,
  SafeAreaView, ScrollView, StatusBar,
} from 'react-native';
import { useCart } from '../context/CartContext';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart, cart, updateQuantity, cartCount, cartTotal } = useCart();
  const [qty, setQty] = useState(1);

  const existingItem = cart.find((item) => item._id === product._id);
  const currentQty = existingItem ? existingItem.quantity : 0;

  const imageUri = product.imageUrl || product.images?.[0] || product.image || 'https://via.placeholder.com/400';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090405" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.productImage} accessibilityLabel="Product image" />
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₹{product.price}</Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
            )}
          </View>

          {product.description ? (
            <Text style={styles.description}>{product.description}</Text>
          ) : null}

          {/* Stock Status */}
          <View style={styles.stockRow}>
            <View
              style={[
                styles.stockBadge,
                product.stockQuantity > 0 ? styles.inStock : styles.outOfStock,
              ]}
            >
              <Text style={styles.stockText}>
                {product.stockQuantity > 0
                  ? `✅ In Stock (${product.stockQuantity} available)`
                  : '❌ Out of Stock'}
              </Text>
            </View>
          </View>

          {/* Category */}
          {product.category?.name && (
            <View style={styles.categoryBadgeRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category.name}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Quantity Selector */}
        <View style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Select Quantity</Text>

          <View style={styles.qtySelector}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQty((q) => Math.max(1, q - 1))}
            >
              <Text style={styles.qtyBtnText}>−</Text>
            </TouchableOpacity>

            <Text style={styles.qtyValue}>{qty}</Text>

            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQty((q) => Math.min(99, q + 1))}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>

            <Text style={styles.qtyTotal}>₹{(product.price * qty).toFixed(2)}</Text>
          </View>

          {/* Add / Update Button */}
          <TouchableOpacity
            style={[
              styles.addToCartBtn,
              product.stockQuantity <= 0 && styles.disabledBtn,
            ]}
            disabled={product.stockQuantity <= 0}
            onPress={() => {
              if (existingItem) {
                // Reset to exact qty
                updateQuantity(product._id, qty - currentQty);
              } else {
                addToCart(product, qty);
              }
              navigation.goBack();
            }}
          >
            <Text style={styles.addToCartText}>
              {existingItem
                ? `Update Cart (${currentQty} → ${qty})`
                : `Add ${qty} to Cart • ₹${(product.price * qty).toFixed(0)}`}
            </Text>
          </TouchableOpacity>

          {currentQty > 0 && (
            <Text style={styles.alreadyInCart}>
              🛒 {currentQty} already in your cart
            </Text>
          )}
        </View>

        {/* Delivery Info */}
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Delivery Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>🛵</Text>
            <View>
              <Text style={styles.infoLabel}>Express Delivery</Text>
              <Text style={styles.infoSub}>30-45 minutes within Kagaznagar</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>💰</Text>
            <View>
              <Text style={styles.infoLabel}>Cash on Delivery Available</Text>
              <Text style={styles.infoSub}>Pay when you receive your order</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoEmoji}>📍</Text>
            <View>
              <Text style={styles.infoLabel}>Service Area</Text>
              <Text style={styles.infoSub}>Kagaznagar & surrounding 15 km</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCartBar}
          onPress={() => navigation.navigate('Cart')}
        >
          <View>
            <Text style={styles.cartCountText}>{cartCount} ITEMS</Text>
            <Text style={styles.cartTotalText}>₹{cartTotal.toFixed(2)}</Text>
          </View>
          <Text style={styles.viewCartText}>View Cart →</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090405',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageWrapper: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#1e293b',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  backText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  detailsCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  productName: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 22,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  productPrice: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 26,
  },
  originalPrice: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  stockRow: {
    marginTop: 14,
  },
  stockBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  inStock: {
    backgroundColor: '#14532d',
  },
  outOfStock: {
    backgroundColor: '#7f1d1d',
  },
  stockText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  categoryBadgeRow: {
    marginTop: 10,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 12,
  },
  actionCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  sectionTitle: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
    marginBottom: 14,
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#160d10',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2e1417',
  },
  qtyBtn: {
    backgroundColor: '#1e293b',
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 20,
  },
  qtyValue: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 20,
    paddingHorizontal: 20,
  },
  qtyTotal: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 18,
    marginLeft: 'auto',
    paddingRight: 8,
  },
  addToCartBtn: {
    marginTop: 16,
    backgroundColor: '#ef4444',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: '#374151',
    opacity: 0.5,
  },
  addToCartText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  alreadyInCart: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  infoCard: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  infoEmoji: {
    fontSize: 24,
  },
  infoLabel: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  infoSub: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#dc2626',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#ef4444',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  cartCountText: {
    color: '#fca5a5',
    fontWeight: '800',
    fontSize: 10,
  },
  cartTotalText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 18,
  },
  viewCartText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
});
