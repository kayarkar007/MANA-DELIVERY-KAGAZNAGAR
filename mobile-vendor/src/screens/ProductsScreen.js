import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { getProducts, deleteProduct, updateProduct } from '../api/vendor';

const STATUS_COLOR = { true: '#10b981', false: '#ef4444' };

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      const result = await getProducts(search);
      setProducts(result.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleToggleStock(product) {
    try {
      await updateProduct(product._id, { inStock: !product.inStock });
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, inStock: !p.inStock } : p));
    } catch (e) { Alert.alert('Error', e.message); }
  }

  async function handleDelete(id) {
    Alert.alert('Delete Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await deleteProduct(id);
          setProducts(prev => prev.filter(p => p._id !== id));
        } catch (e) { Alert.alert('Error', e.message); }
      }},
    ]);
  }

  const renderItem = ({ item }) => (
    <View style={s.card}>
      <View style={s.cardTop}>
        <Text style={s.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={s.price}>₹{item.price}</Text>
      </View>
      <Text style={s.category}>{item.categorySlug} • {item.unit}</Text>
      <View style={s.stockRow}>
        <Text style={s.stockText}>Stock: {item.stockQuantity}</Text>
        <TouchableOpacity
          style={[s.stockBadge, { backgroundColor: item.inStock ? '#065f46' : '#7f1d1d' }]}
          onPress={() => handleToggleStock(item)}
        >
          <Text style={s.stockBadgeText}>{item.inStock ? '✅ In Stock' : '❌ Out of Stock'}</Text>
        </TouchableOpacity>
      </View>
      <View style={s.actions}>
        <TouchableOpacity style={s.editBtn} onPress={() => navigation.navigate('EditProduct', { product: item })}>
          <Text style={s.editText}>✏️ Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.delBtn} onPress={() => handleDelete(item._id)}>
          <Text style={s.delText}>🗑 Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Products ({products.length})</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('AddProduct')}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={s.search}
        placeholder="🔍 Search products..."
        placeholderTextColor="#475569"
        value={search}
        onChangeText={setSearch}
      />
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#f59e0b" /></View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={i => i._id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#f59e0b" />}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={s.empty}>No products found</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  addBtn: { backgroundColor: '#f59e0b', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnText: { color: '#000', fontWeight: '800' },
  search: { marginHorizontal: 16, backgroundColor: '#1e293b', borderRadius: 10, padding: 12, color: '#fff', borderWidth: 1, borderColor: '#334155', marginBottom: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#111827', borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#1e293b' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  productName: { color: '#fff', fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 },
  price: { color: '#f59e0b', fontWeight: '800', fontSize: 16 },
  category: { color: '#64748b', fontSize: 12, marginBottom: 10 },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  stockText: { color: '#94a3b8', fontSize: 13 },
  stockBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  stockBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, backgroundColor: '#1e3a5f', borderRadius: 8, padding: 10, alignItems: 'center' },
  editText: { color: '#fff', fontWeight: '700' },
  delBtn: { flex: 1, backgroundColor: '#3b0764', borderRadius: 8, padding: 10, alignItems: 'center' },
  delText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#475569', textAlign: 'center', padding: 32 },
});
