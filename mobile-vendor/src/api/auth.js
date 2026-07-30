import { apiFetch, saveSession, clearSession, getStoredUser } from './client';

export async function loginWithEmail(email, password) {
  const data = await apiFetch('/auth/mobile-login', {
    method: 'POST',
    body: JSON.stringify({ loginType: 'email', email, password, expectedRole: 'vendor' }),
  });
  if (data.success) await saveSession(data.token, data.user);
  return data;
}

export async function logout() { await clearSession(); }
export { getStoredUser };
