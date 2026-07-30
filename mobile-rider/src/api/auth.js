import { apiFetch, saveSession, clearSession, getStoredUser } from './client';

/** Login with email + password (role must be rider) */
export async function loginWithEmail(email, password) {
  const data = await apiFetch('/auth/mobile-login', {
    method: 'POST',
    body: JSON.stringify({ loginType: 'email', email, password, expectedRole: 'rider' }),
  });
  if (data.success) {
    await saveSession(data.token, data.user);
  }
  return data;
}

/** Login with phone + OTP (call after OTP verify) */
export async function loginWithPhone(userId, phone) {
  const data = await apiFetch('/auth/mobile-login', {
    method: 'POST',
    body: JSON.stringify({ loginType: 'phone', userId, phone, expectedRole: 'rider' }),
  });
  if (data.success) {
    await saveSession(data.token, data.user);
  }
  return data;
}

export async function logout() {
  await clearSession();
}

export { getStoredUser };
