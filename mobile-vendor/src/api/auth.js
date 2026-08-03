import { apiFetch, saveSession, clearSession, getStoredUser } from './client';

export async function loginWithEmail(email, password) {
  try {
    const data = await apiFetch('/auth/mobile-login', {
      method: 'POST',
      body: JSON.stringify({ loginType: 'email', email, password, expectedRole: 'vendor' }),
    });
    if (data?.success) await saveSession(data.token, data.user);
    return data || { success: false, error: 'No response from server' };
  } catch (err) {
    return { success: false, error: err.message || 'Login failed. Check your credentials.' };
  }
}

export async function logout() { await clearSession(); }
export { getStoredUser };

