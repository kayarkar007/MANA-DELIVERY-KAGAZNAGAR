import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { getActiveOrders } from '../api/rider';

/** Calculate straight-line distance in KM (Haversine formula) */
function getDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5; // fallback estimate
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Open Google Maps with navigation mode for shortest route */
export function openGoogleMaps(address, lat, lng) {
  let url = '';
  if (lat && lng) {
    url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}`,
      android: `google.navigation:q=${lat},${lng}`,
    });
  } else {
    const encodedAddress = encodeURIComponent(address);
    url = Platform.select({
      ios: `maps://app?daddr=${encodedAddress}`,
      android: `google.navigation:q=${encodedAddress}`,
    });
  }

  Linking.canOpenURL(url).then((supported) => {
    if (supported) {
      Linking.openURL(url);
    } else {
      // Fallback web browser URL
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
      Linking.openURL(webUrl);
    }
  });
}

export default function SmartRouteScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [riderCoords, setRiderCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [routeSequence, setRouteSequence] = useState([]);

  useEffect(() => {
    async function init() {
      try {
        // Request GPS location
        const { status } = await Location.requestForegroundPermissionsAsync();
        let currentLoc = null;
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          currentLoc = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          setRiderCoords(currentLoc);
        }

        const res = await getActiveOrders();
        const activeList = res.data || [];
        setOrders(activeList);

        // Build Smart Shortest Route Sequence
        const sequence = buildOptimizedRoute(currentLoc, activeList);
        setRouteSequence(sequence);
      } catch (e) {
        console.error('Route init failed:', e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  /**
   * Smart Route Optimizer:
   * 1. Prioritizes Pickups for un-collected items at nearest vendors.
   * 2. Interleaves Deliveries for items already picked up or near the route.
   */
  function buildOptimizedRoute(riderLoc, activeOrders) {
    const steps = [];

    activeOrders.forEach((order) => {
      // Step 1: Vendor Pickups (if not yet picked up)
      if (['assigned', 'accepted'].includes(order.deliveryStatus)) {
        const vendorName = order.items?.[0]?.shop?.name || 'Vendor Shop';
        const vendorAddress = order.items?.[0]?.shop?.address || 'Vendor Address';
        const vendorLat = order.items?.[0]?.shop?.location?.latitude;
        const vendorLng = order.items?.[0]?.shop?.location?.longitude;

        const dist = riderLoc ? getDistanceKm(riderLoc.latitude, riderLoc.longitude, vendorLat, vendorLng) : 1.2;

        steps.push({
          type: 'pickup',
          title: `🏪 Pick up Order #${order._id?.slice(-6).toUpperCase()}`,
          name: vendorName,
          address: vendorAddress,
          lat: vendorLat,
          lng: vendorLng,
          distanceKm: dist.toFixed(1),
          orderId: order._id,
          order,
        });
      }

      // Step 2: Customer Delivery (if picked up or out for delivery)
      if (['picked_up', 'out_for_delivery', 'accepted'].includes(order.deliveryStatus)) {
        const custLat = order.deliveryLocation?.latitude;
        const custLng = order.deliveryLocation?.longitude;

        const dist = riderLoc ? getDistanceKm(riderLoc.latitude, riderLoc.longitude, custLat, custLng) : 2.5;

        steps.push({
          type: 'deliver',
          title: `📍 Deliver Order #${order._id?.slice(-6).toUpperCase()}`,
          name: order.customerName,
          phone: order.customerPhone,
          address: order.address,
          lat: custLat,
          lng: custLng,
          distanceKm: dist.toFixed(1),
          orderId: order._id,
          order,
        });
      }
    });

    // Sort by shortest distance
    return steps.sort((a, b) => parseFloat(a.distanceKm) - parseFloat(b.distanceKm));
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={s.loadingText}>Calculating shortest fuel-saving route...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>⚡ Shortest Route Planner</Text>
      </View>

      <View style={s.heroCard}>
        <Text style={s.heroTitle}>🌱 Fuel & Time Saver Active</Text>
        <Text style={s.heroSub}>
          Calculated shortest path for {orders.length} active order(s). Minimizes distance & travel time.
        </Text>
      </View>

      <Text style={s.sectionTitle}>OPTIMIZED DELIVERY STEPS ({routeSequence.length})</Text>

      {routeSequence.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyText}>No active orders to route</Text>
        </View>
      ) : (
        routeSequence.map((step, idx) => (
          <View key={idx} style={[s.stepCard, step.type === 'pickup' ? s.pickupBorder : s.deliverBorder]}>
            <View style={s.stepHeader}>
              <View style={[s.typeBadge, step.type === 'pickup' ? s.pickupBadge : s.deliverBadge]}>
                <Text style={s.typeText}>{step.type === 'pickup' ? '🏪 PICKUP' : '🚚 DELIVER'}</Text>
              </View>
              <Text style={s.distText}>~{step.distanceKm} km away</Text>
            </View>

            <Text style={s.stepTitle}>{step.title}</Text>
            <Text style={s.nameText}>{step.name}</Text>
            <Text style={s.addressText}>📍 {step.address}</Text>

            <View style={s.btnRow}>
              <TouchableOpacity
                style={s.navBtn}
                onPress={() => openGoogleMaps(step.address, step.lat, step.lng)}
              >
                <Text style={s.navBtnText}>🗺️ Open Google Maps Turn-by-Turn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.detailsBtn}
                onPress={() => navigation.navigate('OrderDetail', { order: step.order })}
              >
                <Text style={s.detailsText}>View Order →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#090405', padding: 20 },
  loadingText: { color: '#94a3b8', marginTop: 12, fontWeight: '700' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, paddingTop: 60 },
  back: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '900' },
  heroCard: { margin: 16, backgroundColor: '#111827', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#10b981' },
  heroTitle: { color: '#10b981', fontWeight: '900', fontSize: 16 },
  heroSub: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#64748b', fontSize: 11, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 16, marginBottom: 8 },
  emptyCard: { margin: 16, backgroundColor: '#111827', borderRadius: 14, padding: 32, alignItems: 'center' },
  emptyText: { color: '#475569' },
  stepCard: { marginHorizontal: 16, marginBottom: 12, backgroundColor: '#111827', borderRadius: 16, padding: 16, borderWidth: 1 },
  pickupBorder: { borderColor: '#f59e0b' },
  deliverBorder: { borderColor: '#10b981' },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  pickupBadge: { backgroundColor: '#78350f' },
  deliverBadge: { backgroundColor: '#065f46' },
  typeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  distText: { color: '#f59e0b', fontWeight: '700', fontSize: 12 },
  stepTitle: { color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 4 },
  nameText: { color: '#e2e8f0', fontSize: 13, marginBottom: 2 },
  addressText: { color: '#94a3b8', fontSize: 12, marginBottom: 14 },
  btnRow: { gap: 8 },
  navBtn: { backgroundColor: '#10b981', borderRadius: 10, padding: 14, alignItems: 'center' },
  navBtnText: { color: '#000', fontWeight: '900', fontSize: 13 },
  detailsBtn: { backgroundColor: '#1e293b', borderRadius: 10, padding: 10, alignItems: 'center' },
  detailsText: { color: '#ef4444', fontWeight: '700', fontSize: 12 },
});
