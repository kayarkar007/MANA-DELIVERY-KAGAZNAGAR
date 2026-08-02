import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator, ScrollView, RefreshControl, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getCurrentLocationAddress } from '../utils/location';
import { COLORS, SHADOWS } from '../constants/theme';

const APP_LOGO = require('../../assets/icon.png');
const { width: SCREEN_W } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locationText, setLocationText] = useState('Kagaznagar Express Zone');
  const [locating, setLocating] = useState(false);

  const { cart, addToCart, updateQuantity, cartCount, cartTotal } = useCart();

  useEffect(() => {
    autoDetectLocation();
  }, []);

  async function autoDetectLocation() {
    setLocating(true);
    try {
      const res = await getCurrentLocationAddress();
      if (res.success && res.address) {
        setLocationText(res.address);
      }
    } catch (e) {
      console.warn('Auto location detect failed silently', e);
    } finally {
      setLocating(false);
    }
  }

  async function loadData() {
    try {
      // API returns { success, data } — not { categories } / { products }
      const [catData, prodData, shopsData] = await Promise.allSettled([
        apiFetch('/categories'),
        apiFetch(selectedCategory ? `/products?category=${selectedCategory}` : '/products'),
        apiFetch('/shops'),
      ]);

      if (catData.status === 'fulfilled') {
        setCategories(catData.value?.data || catData.value?.categories || []);
      }
      if (prodData.status === 'fulfilled') {
        setProducts(prodData.value?.data || prodData.value?.products || []);
      }
      if (shopsData.status === 'fulfilled') {
        setShops(shopsData.value?.data || []);
      }
    } catch (e) {
      console.error('Failed to load home data', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getCartItemQuantity(productId) {
    const found = cart.find((item) => item._id === productId);
    return found ? found.quantity : 0;
  }

  function renderShopCard({ item }) {
    return (
      <TouchableOpacity
        style={styles.shopCard}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ShopDetail', { shop: item })}
      >
        <Image
          source={{ uri: item.image || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=400' }}
          style={styles.shopImage}
          resizeMode="cover"
        />
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.shopMeta}>
            <Ionicons name="location-outline" size={11} color={COLORS.textDark} />
            <Text style={styles.shopAddress} numberOfLines={1}>{item.address || 'Kagaznagar'}</Text>
          </View>
          <View style={styles.shopOpenBadge}>
            <View style={styles.shopOpenDot} />
            <Text style={styles.shopOpenText}>Open Now</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderProductCard({ item }) {
    const qty = getCartItemQuantity(item._id);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' }}
            style={styles.productImage}
            resizeMode="cover"
          />
          {item.price < 200 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>HOT</Text>
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.productCategory}>{item.categorySlug || 'Grocery'}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.productPrice}>₹{item.price}</Text>
              {item.unit && <Text style={styles.unitText}>per {item.unit}</Text>}
            </View>

            {qty > 0 ? (
              <View style={styles.qtyControlRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, -1)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item._id, 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item, 1)}>
                <Ionicons name="add" size={16} color={COLORS.white} />
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  const ListHeader = (
    <>
      {/* Hero Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerContent}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>⚡ EXPRESS DELIVERY</Text>
          </View>
          <Text style={styles.bannerTitle}>Fast Local Delivery</Text>
          <Text style={styles.bannerSub}>Fresh Groceries in Kagaznagar</Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('Shops')}>
            <Text style={styles.bannerBtnText}>Browse Shops →</Text>
          </TouchableOpacity>
        </View>
        <Ionicons name="flash" size={52} color={COLORS.primary} style={{ opacity: 0.9 }} />
      </View>

      {/* Shops Near You */}
      {shops.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shops Near You</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Shops')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={shops.slice(0, 8)}
            keyExtractor={(item) => item._id}
            renderItem={renderShopCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shopListContent}
          />
        </View>
      )}

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.catPill, selectedCategory === null && styles.catPillActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.catText, selectedCategory === null && styles.catTextActive]}>
              🛒 All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <TouchableOpacity
                key={cat._id}
                style={[styles.catPill, isActive && styles.catPillActive]}
                onPress={() => setSelectedCategory(cat.slug)}
              >
                <Text style={[styles.catText, isActive && styles.catTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Products header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory ? `${selectedCategory} Products` : 'All Products'}
        </Text>
        <Text style={styles.productCount}>{filteredProducts.length} items</Text>
      </View>

      {loading && (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 30 }} />
      )}
    </>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandRow}>
            <Image source={APP_LOGO} style={styles.headerLogo} />
            <View style={styles.liveDot} />
            <Text style={styles.brandTitle}>Mana Delivery</Text>
          </View>
          <TouchableOpacity
            style={styles.locationRow}
            onPress={autoDetectLocation}
            activeOpacity={0.7}
          >
            <Ionicons name="location" size={12} color={COLORS.primary} />
            <Text style={styles.locationSub} numberOfLines={1}>
              {locating ? 'Detecting location...' : locationText}
            </Text>
            <Ionicons name="chevron-down" size={12} color={COLORS.textDark} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchSection}
        onPress={() => navigation.navigate('Search')}
        activeOpacity={0.85}
      >
        <Ionicons name="search" size={18} color={COLORS.textMuted} style={styles.searchIcon} />
        <Text style={styles.searchPlaceholder}>Search products, shops...</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item._id}
        renderItem={renderProductCard}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          cartCount > 0 && { paddingBottom: 90 },
        ]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Ionicons name="basket-outline" size={48} color={COLORS.textDark} />
              <Text style={styles.emptyText}>No products found.</Text>
              <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                <Text style={styles.emptyLink}>Show all products</Text>
              </TouchableOpacity>
            </View>
          )
        }
      />

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <TouchableOpacity
          style={styles.floatingCartBar}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('CartTab')}
        >
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartBadge}>
              <Text style={styles.floatingCartBadgeText}>{cartCount}</Text>
            </View>
            <View>
              <Text style={styles.floatingCartTotal}>₹{cartTotal}</Text>
              <Text style={styles.floatingCartSub}>Item total (excl. delivery)</Text>
            </View>
          </View>
          <View style={styles.floatingCartRight}>
            <Text style={styles.floatingCartBtnText}>View Cart</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.white} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: { flex: 1 },
  headerLogo: { width: 30, height: 30, borderRadius: 8, marginRight: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  liveDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: COLORS.accent, marginRight: 6,
  },
  brandTitle: { fontSize: 19, fontWeight: '900', color: COLORS.text, letterSpacing: -0.5 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  locationSub: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600', maxWidth: 200 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  searchSection: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderWidth: 1,
    borderColor: COLORS.inputBorder, borderRadius: 14,
    marginHorizontal: 16, paddingHorizontal: 12,
    height: 44, marginBottom: 8,
  },
  searchIcon: { marginRight: 8 },
  searchPlaceholder: { flex: 1, color: COLORS.textDark, fontSize: 14, fontWeight: '500' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },

  // Banner
  bannerCard: {
    backgroundColor: COLORS.card, borderRadius: 18,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 18, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    marginVertical: 10, ...SHADOWS.small,
  },
  bannerContent: { flex: 1, paddingRight: 10 },
  bannerBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)', alignSelf: 'flex-start',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6,
  },
  bannerBadgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '900' },
  bannerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  bannerSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  bannerBtn: {
    backgroundColor: COLORS.primary, alignSelf: 'flex-start',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10,
  },
  bannerBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 12 },

  // Section
  section: { marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  seeAll: { color: COLORS.primary, fontSize: 12, fontWeight: '700' },
  productCount: { color: COLORS.textDark, fontSize: 12, fontWeight: '600' },

  // Shop cards
  shopListContent: { paddingRight: 8, gap: 10 },
  shopCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    width: 150, overflow: 'hidden', ...SHADOWS.small,
  },
  shopImage: { width: '100%', height: 90 },
  shopInfo: { padding: 10 },
  shopName: { fontSize: 13, fontWeight: '800', color: COLORS.text },
  shopMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3 },
  shopAddress: { fontSize: 10, color: COLORS.textDark, flex: 1 },
  shopOpenBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  shopOpenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent },
  shopOpenText: { color: COLORS.accent, fontSize: 10, fontWeight: '700' },

  // Categories
  catPill: {
    backgroundColor: COLORS.card, borderWidth: 1,
    borderColor: COLORS.cardBorder, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, marginRight: 8,
  },
  catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  catTextActive: { color: COLORS.white },

  // Product Cards
  columnWrapper: { justifyContent: 'space-between' },
  card: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    width: '48.5%', marginBottom: 12, overflow: 'hidden', ...SHADOWS.small,
  },
  imageContainer: { position: 'relative', width: '100%', height: 120, backgroundColor: '#0F172A' },
  productImage: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute', top: 6, left: 6,
    backgroundColor: COLORS.accent, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  discountBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '900' },
  cardContent: { padding: 10 },
  productCategory: {
    fontSize: 10, color: COLORS.textDark,
    fontWeight: '700', textTransform: 'uppercase',
  },
  productName: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 2, height: 36 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  productPrice: { fontSize: 15, fontWeight: '900', color: COLORS.text },
  unitText: { fontSize: 10, color: COLORS.textDark },
  addButton: {
    backgroundColor: COLORS.primary, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
  },
  addButtonText: { color: COLORS.white, fontSize: 11, fontWeight: '900', marginLeft: 2 },
  qtyControlRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderRadius: 8,
    borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: 4, paddingVertical: 2,
  },
  qtyBtn: { paddingHorizontal: 6, paddingVertical: 2 },
  qtyBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '900' },
  qtyText: { color: COLORS.text, fontSize: 12, fontWeight: '800', paddingHorizontal: 4 },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 8, fontWeight: '600' },
  emptyLink: { color: COLORS.primary, fontSize: 13, fontWeight: '700', marginTop: 8 },

  // Floating cart
  floatingCartBar: {
    position: 'absolute', bottom: 12, left: 16, right: 16,
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingHorizontal: 16, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...SHADOWS.medium,
  },
  floatingCartLeft: { flexDirection: 'row', alignItems: 'center' },
  floatingCartBadge: {
    backgroundColor: COLORS.white, width: 24, height: 24,
    borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  floatingCartBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '900' },
  floatingCartTotal: { color: COLORS.white, fontSize: 16, fontWeight: '900' },
  floatingCartSub: { color: 'rgba(255,255,255,0.8)', fontSize: 10, fontWeight: '600' },
  floatingCartRight: { flexDirection: 'row', alignItems: 'center' },
  floatingCartBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '900', marginRight: 4 },
});
