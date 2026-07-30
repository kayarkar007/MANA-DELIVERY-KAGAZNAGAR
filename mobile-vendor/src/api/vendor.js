import { apiFetch } from './client';

export const getShop = () => apiFetch('/vendor/shop');
export const updateShop = (data) => apiFetch('/vendor/shop', { method: 'PATCH', body: JSON.stringify(data) });

export const getProducts = (search = '') => apiFetch(`/vendor/products${search ? `?search=${search}` : ''}`);
export const addProduct = (data) => apiFetch('/vendor/products', { method: 'POST', body: JSON.stringify(data) });
export const updateProduct = (id, data) => apiFetch(`/vendor/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteProduct = (id) => apiFetch(`/vendor/products/${id}`, { method: 'DELETE' });

export const getOrders = (status = '') => apiFetch(`/vendor/orders${status ? `?status=${status}` : ''}`);
export const getOrder = (id) => apiFetch(`/vendor/orders/${id}`);
export const updateOrder = (id, status, note = '') => apiFetch(`/vendor/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status, note }) });

export const getAnalytics = () => apiFetch('/vendor/analytics');

export const registerFCMToken = (fcmToken) => apiFetch('/user/fcm-token', { method: 'POST', body: JSON.stringify({ fcmToken }) });
