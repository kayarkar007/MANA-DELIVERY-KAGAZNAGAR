import * as Location from 'expo-location';

export const KAGAZNAGAR_CENTER = {
  latitude: 19.3316,
  longitude: 79.4831,
  name: 'Kagaznagar, Telangana',
};

export const MAX_SERVICE_RADIUS_KM = 15;

/**
 * Haversine formula to calculate distance in KM between two GPS coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2 = KAGAZNAGAR_CENTER.latitude, lon2 = KAGAZNAGAR_CENTER.longitude) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

/**
 * Requests location permission and returns accurate GPS position & address string
 */
export async function getCurrentLocationAddress() {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Location permission was denied. Please allow location access in settings.',
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = position.coords;
    const distanceKm = calculateDistanceKm(latitude, longitude);
    const isServiceable = distanceKm <= MAX_SERVICE_RADIUS_KM;

    let addressString = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;

    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const parts = [
          place.name || place.streetNumber,
          place.street || place.subregion,
          place.city || place.district || 'Kagaznagar',
          place.region,
          place.postalCode,
        ].filter(Boolean);

        if (parts.length > 0) {
          addressString = parts.join(', ');
        }
      }
    } catch (e) {
      console.warn('Reverse geocode warning:', e);
    }

    return {
      success: true,
      latitude,
      longitude,
      address: addressString,
      distanceKm,
      isServiceable,
    };
  } catch (err) {
    console.error('Location detection error:', err);
    return {
      success: false,
      error: 'Failed to fetch GPS location. Please ensure GPS/Location services are enabled on your device.',
    };
  }
}
