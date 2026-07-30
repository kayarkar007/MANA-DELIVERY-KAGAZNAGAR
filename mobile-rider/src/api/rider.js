import { apiFetch } from './client';

/** Get active orders for this rider */
export async function getActiveOrders(includeStats = false) {
  return apiFetch(`/rider/orders${includeStats ? '?stats=true' : ''}`);
}

/** Update delivery status of an order */
export async function updateOrderStatus(orderId, deliveryStatus, deliveryOtp = null, estimatedDeliveryTime = null) {
  return apiFetch('/rider/orders', {
    method: 'PATCH',
    body: JSON.stringify({ orderId, deliveryStatus, deliveryOtp, estimatedDeliveryTime }),
  });
}

/** Update rider's GPS location */
export async function updateLocation(latitude, longitude) {
  return apiFetch('/rider/location', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  });
}

/** Get shift info + payouts */
export async function getShiftInfo() {
  return apiFetch('/rider/shift');
}

/** Shift action: start / end / break_start / break_end */
export async function shiftAction(action) {
  return apiFetch('/rider/shift', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

/** Register FCM token for push notifications */
export async function registerFCMToken(fcmToken) {
  return apiFetch('/user/fcm-token', {
    method: 'POST',
    body: JSON.stringify({ fcmToken }),
  });
}
