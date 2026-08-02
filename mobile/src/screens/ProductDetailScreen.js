import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { apiFetch } from '../api/client';
import { COLORS, SHADOWS } from '../constants/theme';

export default function ProductDetailScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { product } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { addToCart } = useCart();

  const imageUrl = product?.imageUrl || product?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';

  function handleAddToCart() {
    addToCart(product, quantity);
    navigation.navigate('CartTab');
  }

  async function toggleWishlist() {
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      await apiFetch('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId: product._id }),
      });
      setWishlisted(!wishlisted);
    } catch (e) {
      Alert.alert('Wishlist', e.message || 'Could not update wishlist.');
    } finally {
      setWishlistLoading(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product?.name || 'Product Details'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.backBtn} onPress={toggleWishlist}>
            <Ionicons
              name={wishlisted ? 'heart' : 'heart-outline'}
              size={22}
              color={wishlisted ? '#EC4899' : COLORS.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('CartTab')}>
            <Ionicons name="cart-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Image Card */}
        <View style={styles.imageCard}>
          <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="contain" />
          <View style={styles.stockBadge}>
            <View style={styles.greenDot} />
            <Text style={styles.stockText}>In Stock • Express Delivery</Text>
          </View>
        </View>

        {/* Info Container */}
        <View style={styles.infoCard}>
          <Text style={styles.categoryBadge}>{product?.categorySlug || 'Grocery'}</Text>
          <Text style={styles.title}>{product?.name}</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product?.price}</Text>
            {product?.unit && <Text style={styles.unit}>/ {product?.unit}</Text>}
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>
            {product?.description || 'Fresh, high-quality local product sourced directly for Kagaznagar express delivery.'}
          </Text>

          <View style={styles.divider} />

          {/* Quantity Selector */}
          <Text style={styles.sectionLabel}>Select Quantity</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color={COLORS.text} />
            </TouchableOpacity>

            <Text style={styles.qtyVal}>{quantity}</Text>

            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(quantity + 1)}
            >
              <Ionicons name="add" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.totalLabel}>Total Price</Text>
          <Text style={styles.totalVal}>₹{(product?.price || 0) * quantity}</Text>
        </View>

        <TouchableOpacity
          style={styles.addCartBtn}
          activeOpacity={0.9}
          onPress={handleAddToCart}
        >
          <Ionicons name="bag-add-outline" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.addCartBtnText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  imageCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  productImage: {
    width: '85%',
    height: '85%',
  },
  stockBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginRight: 6,
  },
  stockText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    padding: 18,
    marginTop: 16,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.accent,
  },
  unit: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginLeft: 6,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    marginHorizontal: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.medium,
  },
  totalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  addCartBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addCartBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '900',
  },
});
