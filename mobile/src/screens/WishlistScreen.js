import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';
import { COLORS, SHADOWS } from '../constants/theme';

export default function WishlistScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart } = useCart();

  async function loadWishlist() {
    try {
      // /api/wishlist/details returns full product objects
      const res = await apiFetch('/wishlist/details');
      setProducts(res?.data || res?.products || []);
    } catch (e) {
      console.error('Failed to load wishlist', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function removeFromWishlist(productId) {
    try {
      await apiFetch('/wishlist', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    } catch (e) {
      console.error('Failed to remove from wishlist', e);
    }
  }

  useEffect(() => { loadWishlist(); }, []);

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardImageWrap}
          onPress={() => navigation.navigate('ProductDetail', { product: item })}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' }}
            style={styles.productImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          {item.unit && <Text style={styles.unitText}>per {item.unit}</Text>}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.addCartBtn}
              onPress={() => {
                addToCart(item, 1);
                navigation.navigate('CartTab');
              }}
            >
              <Ionicons name="cart-outline" size={15} color={COLORS.white} />
              <Text style={styles.addCartTxt}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeFromWishlist(item._id)}
            >
              <Ionicons name="heart-dislike-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wishlist</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.colWrapper}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadWishlist(); }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={54} color={COLORS.textDark} />
              <Text style={styles.emptyTxt}>Your wishlist is empty.</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Home')}>
                <Text style={styles.emptyLink}>Browse Products →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  list: { paddingHorizontal: 16, paddingBottom: 30 },
  colWrapper: { justifyContent: 'space-between' },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    width: '48.5%', marginBottom: 14, overflow: 'hidden', ...SHADOWS.small,
  },
  cardImageWrap: {},
  productImage: { width: '100%', height: 120 },
  cardContent: { padding: 10 },
  productName: { fontSize: 12, fontWeight: '700', color: COLORS.text, height: 32 },
  productPrice: { fontSize: 15, fontWeight: '900', color: COLORS.text, marginTop: 4 },
  unitText: { fontSize: 10, color: COLORS.textDark },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  addCartBtn: {
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 6, gap: 4,
  },
  addCartTxt: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  removeBtn: { padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTxt: { color: COLORS.textMuted, fontSize: 15, marginTop: 10 },
  emptyLink: { color: COLORS.primary, fontWeight: '700', fontSize: 13, marginTop: 10 },
});
