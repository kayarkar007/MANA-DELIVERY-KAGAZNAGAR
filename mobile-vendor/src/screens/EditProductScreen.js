import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { updateProduct } from '../api/vendor';

const CATEGORIES = ['grocery', 'dairy', 'bakery', 'beverages', 'vegetables', 'fruits', 'snacks', 'medicines', 'household', 'electronics', 'clothing', 'other'];
const UNITS = ['piece', 'kg', 'gm', '500gm', '250gm', 'litre', '500ml', '250ml', 'dozen', 'pack'];

export default function EditProductScreen({ navigation }) {
  const { params } = useRoute();
  const product = params.product;

  const [form, setForm] = useState({
    name: product.name || '',
    description: product.description || '',
    price: product.price ? String(product.price) : '',
    unit: product.unit || UNITS[0],
    categorySlug: product.categorySlug || CATEGORIES[0],
    stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : '10',
    lowStockThreshold: product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : '5',
    image: product.image || '',
    isHidden: !!product.isHidden,
    inStock: product.inStock !== false,
  });
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit() {
    if (!form.name.trim() || !form.price) { Alert.alert('Error', 'Name and price are required.'); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) { Alert.alert('Error', 'Enter a valid price.'); return; }

    setLoading(true);
    try {
      await updateProduct(product._id, {
        name: form.name.trim(),
        description: form.description.trim(),
        price,
        unit: form.unit,
        categorySlug: form.categorySlug,
        stockQuantity: parseInt(form.stockQuantity) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 5,
        image: form.image.trim(),
        isHidden: form.isHidden,
        inStock: form.inStock,
      });
      Alert.alert('✅ Success', 'Product updated!', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) { Alert.alert('Error', e.message); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Back</Text></TouchableOpacity>
          <Text style={s.title}>Edit Product</Text>
        </View>

        <Field label="Product Name *" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Amul Butter 100g" />
        <Field label="Description" value={form.description} onChange={v => set('description', v)} placeholder="Optional..." multiline />
        <Field label="Price (₹) *" value={form.price} onChange={v => set('price', v)} placeholder="0" keyboardType="decimal-pad" />
        <Field label="Stock Quantity" value={form.stockQuantity} onChange={v => set('stockQuantity', v)} keyboardType="numeric" />
        <Field label="Low Stock Alert At" value={form.lowStockThreshold} onChange={v => set('lowStockThreshold', v)} keyboardType="numeric" />
        <Field label="Image URL" value={form.image} onChange={v => set('image', v)} placeholder="https://..." />

        <Text style={s.label}>Unit</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
          {UNITS.map(u => (
            <TouchableOpacity key={u} style={[s.chip, form.unit === u && s.chipActive]} onPress={() => set('unit', u)}>
              <Text style={[s.chipText, form.unit === u && s.chipActiveText]}>{u}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={s.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipRow}>
          {CATEGORIES.map(c => (
            <TouchableOpacity key={c} style={[s.chip, form.categorySlug === c && s.chipActive]} onPress={() => set('categorySlug', c)}>
              <Text style={[s.chipText, form.categorySlug === c && s.chipActiveText]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.switchRow}>
          <Text style={s.switchLabel}>In Stock</Text>
          <Switch value={form.inStock} onValueChange={v => set('inStock', v)} trackColor={{ true: '#10b981' }} />
        </View>

        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Hide from customers</Text>
          <Switch value={form.isHidden} onValueChange={v => set('isHidden', v)} trackColor={{ true: '#ef4444' }} />
        </View>

        <TouchableOpacity style={[s.submitBtn, loading && s.disabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={s.submitText}>💾 Save Changes</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...props }) {
  return (
    <>
      <Text style={s.label}>{label}</Text>
      <TextInput style={[s.input, props.multiline && { height: 80, textAlignVertical: 'top' }]} placeholderTextColor="#475569" {...props} />
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  inner: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  back: { color: '#f59e0b', fontWeight: '700', fontSize: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  chipRow: { marginBottom: 4 },
  chip: { backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  chipActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  chipText: { color: '#94a3b8', fontWeight: '600' },
  chipActiveText: { color: '#000', fontWeight: '800' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 8 },
  switchLabel: { color: '#e2e8f0', fontSize: 15 },
  submitBtn: { backgroundColor: '#f59e0b', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 28, marginBottom: 40 },
  disabled: { opacity: 0.6 },
  submitText: { color: '#000', fontWeight: '900', fontSize: 16 },
});
