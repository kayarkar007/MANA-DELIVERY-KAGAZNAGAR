import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { COLORS, SHADOWS } from '../constants/theme';

export default function ShopsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadShops() {
    try {
      const res = await apiFetch('/shops');
      setShops(res?.data || []);
    } catch (e) {
      console.error('Failed to load shops', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadShops(); }, []);

  const filtered = shops.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function renderShop({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => navigation.navigate('ShopDetail', { shop: item })}
      >
        <Image
          source={{ uri: item.image || 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=600' }}
          style={styles.shopImage}
          resizeMode="cover"
        />
        <View style={styles.openBadge}>
          <View style={styles.openDot} />
          <Text style={styles.openText}>Open</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.shopName}>{item.name}</Text>
          {item.description ? (
            <Text style={styles.shopDesc} numberOfLines={2}>{item.description}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={COLORS.textDark} />
            <Text style={styles.metaText} numberOfLines={1}>{item.address || 'Kagaznagar'}</Text>
          </View>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate('ShopDetail', { shop: item })}
          >
            <Text style={styles.shopBtnText}>Browse Products →</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shops Near You</Text>
        <Text style={styles.headerSub}>{shops.length} local stores</Text>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={17} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shops..."
          placeholderTextColor={COLORS.textDark}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={17} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderShop}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadShops(); }}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="storefront-outline" size={54} color={COLORS.textDark} />
              <Text style={styles.emptyText}>No shops found.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: COLORS.text },
  headerSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.inputBg, borderWidth: 1,
    borderColor: COLORS.inputBorder, borderRadius: 14,
    marginHorizontal: 16, paddingHorizontal: 12, height: 44, marginBottom: 12,
  },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingBottom: 30, gap: 14 },
  card: {
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    overflow: 'hidden', ...SHADOWS.small,
  },
  shopImage: { width: '100%', height: 160 },
  openBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(9,13,22,0.85)', borderRadius: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 4, gap: 5,
  },
  openDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent },
  openText: { color: COLORS.accent, fontSize: 11, fontWeight: '800' },
  cardBody: { padding: 14 },
  shopName: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  shopDesc: { fontSize: 13, color: COLORS.textMuted, marginTop: 4, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  metaText: { fontSize: 12, color: COLORS.textDark, flex: 1 },
  shopBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center', marginTop: 12,
  },
  shopBtnText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 15, marginTop: 10 },
});
