import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { apiFetch } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('enter-phone'); // enter-phone | enter-otp
  const [loading, setLoading] = useState(false);

  const { loginWithPhoneOtp } = useAuth();

  async function handleSendOtp() {
    if (phone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/phone-otp/send', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      setStep('enter-otp');
      Alert.alert('OTP Sent', 'Check your mobile for the 6-digit verification code.');
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    try {
      await loginWithPhoneOtp(phone, otp);
      Alert.alert('Welcome!', 'Logged in successfully.');
      navigation.replace('MainTabs');
    } catch (e) {
      Alert.alert('Verification Failed', e.message || 'Incorrect OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logoHeader}>🛵 Mana Delivery</Text>
        <Text style={styles.title}>
          {step === 'enter-phone' ? 'Phone Login' : 'Enter Verification Code'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'enter-phone'
            ? 'Enter your mobile number to receive a 6-digit OTP'
            : `Code sent to +91 ${phone}`}
        </Text>

        {step === 'enter-phone' ? (
          <View style={styles.inputContainer}>
            <Text style={styles.prefix}>🇮🇳 +91</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
            />
          </View>
        ) : (
          <TextInput
            style={[styles.input, styles.otpInput]}
            placeholder="• • • • • •"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />
        )}

        <TouchableOpacity
          style={styles.submitButton}
          onPress={step === 'enter-phone' ? handleSendOtp : handleVerifyOtp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {step === 'enter-phone' ? 'Send OTP →' : 'Verify & Login'}
            </Text>
          )}
        </TouchableOpacity>

        {step === 'enter-otp' && (
          <TouchableOpacity
            style={styles.changePhoneButton}
            onPress={() => {
              setStep('enter-phone');
              setOtp('');
            }}
          >
            <Text style={styles.changePhoneText}>← Change Phone Number</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090405',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoHeader: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#160d10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2e1417',
    marginBottom: 20,
    overflow: 'hidden',
  },
  prefix: {
    paddingHorizontal: 16,
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
    borderRightWidth: 1,
    borderRightColor: '#2e1417',
  },
  input: {
    flex: 1,
    color: '#ffffff',
    padding: 16,
    fontSize: 18,
    fontWeight: '700',
  },
  otpInput: {
    backgroundColor: '#160d10',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2e1417',
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 12,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  changePhoneButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  changePhoneText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 14,
  },
});
