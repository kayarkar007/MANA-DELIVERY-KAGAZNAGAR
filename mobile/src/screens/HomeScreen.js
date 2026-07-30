import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, FlatList, Image, TouchableOpacity,
  TextInput, ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';

export default function HomeScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const { addToCart, cartCount, cartTotal } = useCart();

  async function loadData() {
    setLoading(true);
    try {
      const catData = await apiFetch('/categories');
      setCategories(catData.categories || []);

      const endpoint = selectedCategory
        ? `/products?category=${selectedCategory}`
        : '/products';
      const prodData = await apiFetch(endpoint);
      setProducts(prodData.products || []);
    } catch (e) {
      console.error('Failed to load home data', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function renderProductCard({ item }) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <Image
          source={{ uri: item.imageUrl || item.images?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.productImage}
          accessibilityLabel={item.name}
        />
        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.price}</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => addToCart(item, 1)}
          >
            <Text style={styles.addButtonText}>ADD +</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#090405" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.brandTitle}>🛵 Mana Delivery</Text>
          <Text style={styles.locationSub}>Kagaznagar Express</Text>
        </View>

        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search groceries, medicines..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories Horizontal Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ _id: 'all', name: 'All' }, ...categories]}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const isSelected =
              item._id === 'all' ? selectedCategory === null : selectedCategory === item._id;
            return (
              <TouchableOpacity
                style={[styles.categoryPill, isSelected && styles.selectedPill]}
                onPress={() =>
                  setSelectedCategory(item._id === 'all' ? null : item._id)
                }
              >
                <Text
                  style={[styles.categoryText, isSelected && styles.selectedCategoryText]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Main Product List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#ef4444" />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          numColumns={2}
          keyExtractor={(item) => item._id}
          renderItem={renderProductCard}
          contentContainerStyle={styles.gridContainer}
        />
      )}

      {/* Floating Cart Button Bar */}
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
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  logoRow: {
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
  },
  locationSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  searchBar: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedPill: {
    backgroundColor: '#ef4444',
  },
  categoryText: {
    color: '#94a3b8',
    fontWeight: '800',
    fontSize: 13,
  },
  selectedCategoryText: {
    color: '#ffffff',
  },
  gridContainer: {
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#160d10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2e1417',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#1e293b',
  },
  cardContent: {
    padding: 12,
  },
  productName: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    height: 36,
  },
  productPrice: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 16,
    marginTop: 4,
  },
  addButton: {
    marginTop: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
