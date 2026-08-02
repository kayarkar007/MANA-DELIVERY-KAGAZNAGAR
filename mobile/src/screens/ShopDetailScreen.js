import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';
import { COLORS, SHADOWS } from '../constants/theme';

export default function ShopDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { shop } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { cart, addToCart, updateQuantity, cartCount } = useCart();

  async function loadProducts() {
    try {
      // Filter products by shopId (the correct API query param)
      const shopIdParam = shop._id || shop.id;
      const res = await apiFetch(`/products?shopId=${shopIdParam}`);
      setProducts(res?.data || res?.products || []);
    } catch (e) {
      console.error('Failed to load shop products', e);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadProducts(); }, []);

  function getQty(productId) {
    const found = cart.find((item) => item._id === productId);
    return found ? found.quantity : 0;
  }

  function renderProduct({ item }) {
    const qty = getQty(item._id);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <Image
          source={{ uri: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          {item.unit && <Text style={styles.unitText}>per {item.unit}</Text>}

          {qty > 0 ? (
            <View style={styles.qtyRow}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, -1)}>
                <Text style={styles.qtyBtnTxt}>-</Text>
              </TouchableOpacity>
              <Text style={styles.qtyTxt}>{qty}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, 1)}>
                <Text style={styles.qtyBtnTxt}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item, 1)}>
              <Ionicons name="add" size={16} color={COLORS.white} />
              <Text style={styles.addBtnTxt}>ADD</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{shop.name}</Text>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate('CartTab')}
        >
          <Ionicons name="cart-outline" size={22} color={COLORS.text} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Shop Info Banner */}
      <View style={styles.shopBanner}>
        <Image
          source={{ uri: shop.image || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=600' }}
          style={styles.shopBannerImage}
          resizeMode="cover"
        />
        <View style={styles.shopBannerOverlay}>
          <Text style={styles.shopBannerName}>{shop.name}</Text>
          {shop.address ? (
            <View style={styles.shopMetaRow}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.8)" />
              <Text style={styles.shopMetaTxt}>{shop.address}</Text>
            </View>
          ) : null}
          <View style={styles.openBadge}>
            <View style={styles.openDot} />
            <Text style={styles.openTxt}>Open Now</Text>
          </View>
        </View>
      </View>

      {/* Products */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.colWrapper}
          contentContainerStyle={[styles.list, cartCount > 0 && { paddingBottom: 80 }]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadProducts(); }}
              tintColor={COLORS.primary}
            />
          }
          ListHeaderComponent={
            <Text style={styles.productsHeader}>Products ({products.length})</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="basket-outline" size={48} color={COLORS.textDark} />
              <Text style={styles.emptyTxt}>No products listed for this shop yet.</Text>
            </View>
          }
        />
      )}

      {/* Floating cart */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCart}
          onPress={() => navigation.navigate('CartTab')}
          activeOpacity={0.9}
        >
          <View style={styles.floatingCartBadge}>
            <Text style={styles.floatingCartBadgeTxt}>{cartCount}</Text>
          </View>
          <Text style={styles.floatingCartTxt}>View Cart</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: COLORS.text, marginHorizontal: 12 },
  cartBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: COLORS.primary, borderRadius: 8,
    minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '900' },

  shopBanner: { height: 160, marginHorizontal: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 14 },
  shopBannerImage: { width: '100%', height: '100%' },
  shopBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(9,13,22,0.55)',
    padding: 14, justifyContent: 'flex-end',
  },
  shopBannerName: { fontSize: 20, fontWeight: '900', color: COLORS.white },
  shopMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  shopMetaTxt: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  openBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  openDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent },
  openTxt: { color: COLORS.accent, fontSize: 11, fontWeight: '800' },

  productsHeader: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  colWrapper: { justifyContent: 'space-between' },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    width: '48.5%', marginBottom: 12, overflow: 'hidden', ...SHADOWS.small,
  },
  productImage: { width: '100%', height: 110 },
  cardContent: { padding: 10 },
  productName: { fontSize: 12, fontWeight: '700', color: COLORS.text, height: 32 },
  productPrice: { fontSize: 15, fontWeight: '900', color: COLORS.text, marginTop: 4 },
  unitText: { fontSize: 10, color: COLORS.textDark },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.primary,
    paddingHorizontal: 4, paddingVertical: 2, marginTop: 8, alignSelf: 'flex-end',
  },
  qtyBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  qtyBtnTxt: { color: COLORS.primary, fontSize: 14, fontWeight: '900' },
  qtyTxt: { color: COLORS.text, fontSize: 12, fontWeight: '800', paddingHorizontal: 4 },
  addBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 8, marginTop: 8, alignSelf: 'flex-end',
  },
  addBtnTxt: { color: COLORS.white, fontSize: 11, fontWeight: '900', marginLeft: 2 },

  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyTxt: { color: COLORS.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' },

  floatingCart: {
    position: 'absolute', bottom: 12, left: 16, right: 16,
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.medium,
  },
  floatingCartBadge: {
    backgroundColor: COLORS.white, width: 24, height: 24,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  floatingCartBadgeTxt: { color: COLORS.primary, fontSize: 12, fontWeight: '900' },
  floatingCartTxt: { flex: 1, color: COLORS.white, fontSize: 14, fontWeight: '900' },
});
