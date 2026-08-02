import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';
import { COLORS, SHADOWS } from '../constants/theme';

const RECENT_KEY = 'recent_searches';
const MAX_RECENT = 8;

export default function SearchScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [searched, setSearched] = useState(false);
  const { addToCart, cart, updateQuantity } = useCart();

  useEffect(() => {
    inputRef.current?.focus();
    AsyncStorage.getItem(RECENT_KEY).then((v) => {
      if (v) setRecent(JSON.parse(v));
    });
  }, []);

  async function doSearch(q = query) {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);

    // Save to recent
    const updated = [q, ...recent.filter((r) => r !== q)].slice(0, MAX_RECENT);
    setRecent(updated);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));

    try {
      const [prodRes, shopsRes] = await Promise.allSettled([
        apiFetch(`/products?search=${encodeURIComponent(q)}`),
        apiFetch('/shops'),
      ]);
      const prods = prodRes.status === 'fulfilled' ? (prodRes.value?.data || prodRes.value?.products || []) : [];
      const allShops = shopsRes.status === 'fulfilled' ? (shopsRes.value?.data || []) : [];
      const filteredShops = allShops.filter((s) =>
        s.name?.toLowerCase().includes(q.toLowerCase())
      );
      setResults(prods);
      setShops(filteredShops);
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setLoading(false);
    }
  }

  function getQty(productId) {
    const found = cart.find((item) => item._id === productId);
    return found ? found.quantity : 0;
  }

  function renderProduct({ item }) {
    const qty = getQty(item._id);
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
        activeOpacity={0.9}
      >
        <Image
          source={{ uri: item.imageUrl || item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300' }}
          style={styles.productImg}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.price}</Text>
        </View>
        {qty > 0 ? (
          <View style={styles.qtyRow}>
            <TouchableOpacity onPress={() => updateQuantity(item._id, -1)}>
              <Text style={styles.qtyBtn}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyTxt}>{qty}</Text>
            <TouchableOpacity onPress={() => updateQuantity(item._id, 1)}>
              <Text style={styles.qtyBtn}>+</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addBtn} onPress={() => addToCart(item, 1)}>
            <Ionicons name="add" size={18} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Search products, shops..."
          placeholderTextColor={COLORS.textDark}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          onSubmitEditing={() => doSearch()}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setSearched(false); }}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Searches */}
      {!searched && recent.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          {recent.map((r, i) => (
            <TouchableOpacity key={i} style={styles.recentItem} onPress={() => { setQuery(r); doSearch(r); }}>
              <Ionicons name="time-outline" size={16} color={COLORS.textDark} />
              <Text style={styles.recentTxt}>{r}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => { setRecent([]); AsyncStorage.removeItem(RECENT_KEY); }}>
            <Text style={styles.clearTxt}>Clear recent searches</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading */}
      {loading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />}

      {/* Results */}
      {searched && !loading && (
        <FlatList
          data={results}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <>
              {/* Shop results */}
              {shops.length > 0 && (
                <View style={styles.shopResults}>
                  <Text style={styles.sectionTitle}>Shops ({shops.length})</Text>
                  {shops.map((s) => (
                    <TouchableOpacity
                      key={s._id}
                      style={styles.shopItem}
                      onPress={() => navigation.navigate('ShopDetail', { shop: s })}
                    >
                      <Ionicons name="storefront-outline" size={18} color={COLORS.textMuted} />
                      <Text style={styles.shopItemName}>{s.name}</Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textDark} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {results.length > 0 && (
                <Text style={styles.sectionTitle}>Products ({results.length})</Text>
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={COLORS.textDark} />
              <Text style={styles.emptyTxt}>No products found for "{query}"</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10, gap: 10,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1, backgroundColor: COLORS.inputBg, borderWidth: 1,
    borderColor: COLORS.inputBorder, borderRadius: 14,
    paddingHorizontal: 14, height: 44, color: COLORS.text, fontSize: 14,
  },

  recentSection: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  recentItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.cardBorder,
  },
  recentTxt: { flex: 1, color: COLORS.textMuted, fontSize: 14 },
  clearTxt: { color: COLORS.primary, fontWeight: '700', fontSize: 13, marginTop: 12 },

  list: { paddingHorizontal: 16, paddingBottom: 30 },
  productCard: {
    backgroundColor: COLORS.card, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, overflow: 'hidden', ...SHADOWS.small,
  },
  productImg: { width: 80, height: 80 },
  productInfo: { flex: 1, paddingHorizontal: 12, paddingVertical: 8 },
  productName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  productPrice: { fontSize: 15, fontWeight: '900', color: COLORS.text, marginTop: 4 },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderWidth: 1,
    borderColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 4, marginRight: 12,
  },
  qtyBtn: { color: COLORS.primary, fontSize: 18, fontWeight: '900', paddingHorizontal: 4 },
  qtyTxt: { color: COLORS.text, fontSize: 13, fontWeight: '800', paddingHorizontal: 6 },
  addBtn: {
    backgroundColor: COLORS.primary, width: 36, height: 36,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },

  shopResults: { marginBottom: 16 },
  shopItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.card, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8,
  },
  shopItemName: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyTxt: { color: COLORS.textMuted, fontSize: 14, marginTop: 10, textAlign: 'center' },
});
