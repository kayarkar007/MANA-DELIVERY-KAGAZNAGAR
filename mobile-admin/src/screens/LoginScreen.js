import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { loginWithEmail } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) { Alert.alert('Error', 'Enter email and password.'); return; }
    setLoading(true);
    try {
      const result = await loginWithEmail(email.trim(), password);
      if (result.success) signIn(result.user);
      else Alert.alert('Login Failed', result.error || 'Admin access only.');
    } catch (e) { Alert.alert('Login Failed', e.message); }
    finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">
        <View style={s.logo}>
          <Text style={s.emoji}>⚙️</Text>
          <Text style={s.brand}>Mana Delivery</Text>
          <Text style={s.subtitle}>Admin Panel</Text>
        </View>
        <View style={s.card}>
          <Text style={s.label}>Admin Email</Text>
          <TextInput style={s.input} placeholder="admin@manadelivery.in" placeholderTextColor="#475569" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Text style={s.label}>Password</Text>
          <TextInput style={s.input} placeholder="••••••••" placeholderTextColor="#475569" secureTextEntry value={password} onChangeText={setPassword} />
          <TouchableOpacity style={[s.btn, loading && s.disabled]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Login to Admin Panel →</Text>}
          </TouchableOpacity>
        </View>
        <Text style={s.footer}>Admin access only. Unauthorized access is prohibited.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090405' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { alignItems: 'center', marginBottom: 36 },
  emoji: { fontSize: 52 },
  brand: { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#6366f1', fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  card: { backgroundColor: '#111827', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#1e293b' },
  label: { color: '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#334155' },
  btn: { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  disabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  footer: { textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 24 },
});
