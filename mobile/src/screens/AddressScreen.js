import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { apiFetch } from '../api/client';
import { COLORS, SHADOWS } from '../constants/theme';

const ADDRESS_LABELS = ['Home', 'Work', 'Other'];

export default function AddressScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('Home');
  const [newLat, setNewLat] = useState(null);
  const [newLng, setNewLng] = useState(null);

  // If called from cart, we have an onSelect callback
  const onSelect = route?.params?.onSelect;

  async function loadAddresses() {
    try {
      const res = await apiFetch('/user/profile');
      setSavedAddresses(res?.data?.savedAddresses || []);
    } catch (e) {
      console.error('Failed to load addresses', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAddresses(); }, []);

  async function autoDetect() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Enable location access in Settings to auto-detect your address.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [geoResult] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const parts = [
        geoResult.name,
        geoResult.street,
        geoResult.district,
        geoResult.city,
        geoResult.region,
      ].filter(Boolean);
      const formatted = parts.join(', ');
      setNewAddress(formatted);
      setNewLat(loc.coords.latitude);
      setNewLng(loc.coords.longitude);
    } catch (e) {
      Alert.alert('Error', 'Could not detect location. Please enter manually.');
    } finally {
      setLocating(false);
    }
  }

  async function saveAddress() {
    if (!newAddress.trim()) {
      Alert.alert('Required', 'Please enter an address or use Auto-Detect.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'ADD_ADDRESS',
          addressData: {
            label: newLabel,
            address: newAddress.trim(),
            lat: newLat || 19.3315,
            lng: newLng || 79.4828,
          },
        }),
      });
      setNewAddress('');
      setNewLat(null);
      setNewLng(null);
      setShowForm(false);
      await loadAddresses();
      Alert.alert('Saved! 🎉', 'Address added successfully.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to save address. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAddress(addrId) {
    Alert.alert('Delete Address', 'Remove this saved address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await apiFetch('/user/profile', {
              method: 'PUT',
              body: JSON.stringify({ action: 'DELETE_ADDRESS', addressId: addrId }),
            });
            loadAddresses();
          } catch (e) {
            Alert.alert('Error', 'Could not delete address.');
          }
        },
      },
    ]);
  }

  async function setDefault(addr) {
    try {
      await apiFetch('/user/profile', {
        method: 'PUT',
        body: JSON.stringify({
          action: 'SET_DEFAULT',
          addressData: { address: addr.address, lat: addr.lat, lng: addr.lng },
        }),
      });
      Alert.alert('Updated!', 'Default delivery address updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not update default address.');
    }
  }

  const labelColors = { Home: COLORS.primary, Work: COLORS.gold, Other: COLORS.accent };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowForm(!showForm)}
        >
          <Ionicons name={showForm ? "close" : "add"} size={22} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Add Address Form */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add New Address</Text>

            {/* Auto-detect button */}
            <TouchableOpacity style={styles.autoDetectBtn} onPress={autoDetect} disabled={locating}>
              {locating ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Ionicons name="locate" size={16} color={COLORS.white} />
              )}
              <Text style={styles.autoDetectTxt}>
                {locating ? 'Detecting...' : 'Auto-Detect My Location'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.orDivider}>— or enter manually —</Text>

            <TextInput
              style={styles.textInput}
              placeholder="Full address (House No, Street, Area)"
              placeholderTextColor={COLORS.textDark}
              value={newAddress}
              onChangeText={setNewAddress}
              multiline
              numberOfLines={3}
            />

            {/* Label selector */}
            <Text style={styles.labelTitle}>Label</Text>
            <View style={styles.labelRow}>
              {ADDRESS_LABELS.map((lbl) => (
                <TouchableOpacity
                  key={lbl}
                  style={[styles.labelPill, newLabel === lbl && { backgroundColor: labelColors[lbl], borderColor: labelColors[lbl] }]}
                  onPress={() => setNewLabel(lbl)}
                >
                  <Text style={[styles.labelPillTxt, newLabel === lbl && { color: COLORS.white }]}>{lbl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={saveAddress} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnTxt}>Save Address</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Saved Addresses List */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : savedAddresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={54} color={COLORS.textDark} />
            <Text style={styles.emptyTxt}>No saved addresses yet.</Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowForm(true)}>
              <Text style={styles.addFirstTxt}>+ Add Your First Address</Text>
            </TouchableOpacity>
          </View>
        ) : (
          savedAddresses.map((addr, idx) => (
            <View key={addr._id || idx} style={styles.addrCard}>
              <View style={styles.addrLeft}>
                <View style={[styles.labelChip, { backgroundColor: labelColors[addr.label] || COLORS.primary + '22' }]}>
                  <Text style={styles.labelChipTxt}>{addr.label || 'Other'}</Text>
                </View>
                <Text style={styles.addrText}>{addr.address}</Text>
              </View>
              <View style={styles.addrActions}>
                {onSelect ? (
                  <TouchableOpacity
                    style={styles.selectBtn}
                    onPress={() => {
                      onSelect(addr);
                      navigation.goBack();
                    }}
                  >
                    <Text style={styles.selectBtnTxt}>Use</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setDefault(addr)} style={styles.defaultBtn}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.accent} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => deleteAddress(addr._id)} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '900', color: COLORS.text, marginHorizontal: 12 },
  addBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  scroll: { padding: 16, paddingBottom: 40 },

  formCard: {
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 16, marginBottom: 16, ...SHADOWS.small,
  },
  formTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  autoDetectBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 8, marginBottom: 10,
  },
  autoDetectTxt: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  orDivider: { color: COLORS.textDark, fontSize: 12, textAlign: 'center', marginVertical: 10 },
  textInput: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 12, padding: 12, color: COLORS.text, fontSize: 14,
    textAlignVertical: 'top', minHeight: 80,
  },
  labelTitle: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  labelRow: { flexDirection: 'row', gap: 8 },
  labelPill: {
    borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
  },
  labelPillTxt: { color: COLORS.textMuted, fontSize: 13, fontWeight: '700' },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', marginTop: 14,
  },
  saveBtnTxt: { color: COLORS.white, fontWeight: '900', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyTxt: { color: COLORS.textMuted, fontSize: 15, marginTop: 10 },
  addFirstBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 16,
  },
  addFirstTxt: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  addrCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 14, marginBottom: 12,
    flexDirection: 'row', alignItems: 'center', ...SHADOWS.small,
  },
  addrLeft: { flex: 1 },
  labelChip: {
    alignSelf: 'flex-start', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6,
  },
  labelChipTxt: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  addrText: { color: COLORS.text, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  addrActions: { flexDirection: 'row', gap: 10, marginLeft: 10 },
  selectBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  selectBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 12 },
  defaultBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
});
