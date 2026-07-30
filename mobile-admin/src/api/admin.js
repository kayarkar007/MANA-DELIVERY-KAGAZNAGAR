import { apiFetch } from './client';

// Analytics
export const getAnalytics = () => apiFetch('/admin/analytics');

// Orders
export const getOrders = (params = '') => apiFetch(`/admin/orders${params ? `?${params}` : ''}`);
export const updateOrder = (id, data) => apiFetch(`/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const bulkUpdateOrders = (orderIds, status) => apiFetch('/admin/orders/bulk-update', { method: 'POST', body: JSON.stringify({ orderIds, status }) });

// Users
export const getUsers = (params = '') => apiFetch(`/admin/users${params ? `?${params}` : ''}`);
export const updateUser = (id, data) => apiFetch(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

// Riders
export const getRiders = () => apiFetch('/admin/riders');

// Promo codes
export const getPromos = () => apiFetch('/admin/promo');
export const createPromo = (data) => apiFetch('/admin/promo', { method: 'POST', body: JSON.stringify(data) });
export const deletePromo = (id) => apiFetch(`/admin/promo/${id}`, { method: 'DELETE' });

// Reviews
export const getReviews = () => apiFetch('/admin/reviews');

// Register FCM
export const registerFCMToken = (fcmToken) => apiFetch('/user/fcm-token', { method: 'POST', body: JSON.stringify({ fcmToken }) });
