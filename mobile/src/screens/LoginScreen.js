import React, { useState, useRef } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../constants/theme";

const TAB_PHONE = "phone";
const TAB_EMAIL = "email";

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { login, sendOTP, verifyOTP } = useAuth();

  const [activeTab, setActiveTab] = useState(TAB_PHONE);

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);

  // Email state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secureText, setSecureText] = useState(true);

  const [loading, setLoading] = useState(false);

  async function handleSendOTP() {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    const res = await sendOTP(cleaned);
    setLoading(false);
    if (res.success) {
      setOtpSent(true);
    } else {
      Alert.alert("Failed", res.message);
    }
  }

  async function handleVerifyOTP() {
    const code = otp.join("");
    if (code.length < 6) {
      Alert.alert("Enter OTP", "Please enter the 6-digit OTP sent to your phone.");
      return;
    }
    setLoading(true);
    const res = await verifyOTP(phone.replace(/\D/g, ""), code);
    setLoading(false);
    if (res.success) {
      navigation.replace("MainTabs");
    } else {
      Alert.alert("Invalid OTP", res.message);
    }
  }

  function handleOtpChange(val, idx) {
    const newOtp = [...otp];
    newOtp[idx] = val.replace(/\D/g, "").slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1]?.focus();
  }

  async function handleEmailLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.success) {
      navigation.replace("MainTabs");
    } else {
      Alert.alert("Login Failed", res.message);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 10 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Logo */}
        <View style={styles.hero}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>Groceries & essentials delivered{"\n"}in Kagaznagar ??</Text>
        </View>

        {/* Tab Toggle */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === TAB_PHONE && styles.tabActive]}
            onPress={() => { setActiveTab(TAB_PHONE); setOtpSent(false); }}
          >
            <Ionicons
              name="phone-portrait-outline"
              size={15}
              color={activeTab === TAB_PHONE ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === TAB_PHONE && styles.tabTextActive]}>
              Phone OTP
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === TAB_EMAIL && styles.tabActive]}
            onPress={() => setActiveTab(TAB_EMAIL)}
          >
            <Ionicons
              name="mail-outline"
              size={15}
              color={activeTab === TAB_EMAIL ? COLORS.primary : COLORS.textMuted}
            />
            <Text style={[styles.tabText, activeTab === TAB_EMAIL && styles.tabTextActive]}>
              Email
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          {activeTab === TAB_PHONE ? (
            <>
              {!otpSent ? (
                <>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.inputRow}>
                    <Text style={styles.countryCode}>+91</Text>
                    <View style={styles.divider} />
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="10-digit mobile number"
                      placeholderTextColor={COLORS.textDark}
                      keyboardType="phone-pad"
                      maxLength={10}
                    />
                  </View>
                  <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    disabled={loading}
                    onPress={handleSendOTP}
                    activeOpacity={0.85}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.btnText}>Send OTP ?</Text>
                    }
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.otpTitle}>OTP Sent to +91 {phone}</Text>
                  <Text style={styles.otpSub}>Enter the 6-digit code below</Text>
                  <View style={styles.otpRow}>
                    {otp.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={r => (otpRefs.current[i] = r)}
                        style={[styles.otpBox, digit && styles.otpBoxFilled]}
                        value={digit}
                        onChangeText={v => handleOtpChange(v, i)}
                        keyboardType="number-pad"
                        maxLength={1}
                        textAlign="center"
                      />
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.btn, loading && styles.btnDisabled]}
                    disabled={loading}
                    onPress={handleVerifyOTP}
                    activeOpacity={0.85}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.btnText}>Verify & Login</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setOtpSent(false)} style={styles.resendRow}>
                    <Text style={styles.resendText}>? Change Number</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            <>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={17} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={COLORS.textDark}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={17} color={COLORS.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textDark}
                  secureTextEntry={secureText}
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                  <Ionicons
                    name={secureText ? "eye-off-outline" : "eye-outline"}
                    size={17}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                disabled={loading}
                onPress={handleEmailLogin}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Log In</Text>
                }
              </TouchableOpacity>
            </>
          )}
        </View>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service & Privacy Policy
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40 },
  hero: { alignItems: "center", marginBottom: 20 },
  logoImage: {
    width: 180,
    height: 180,
    borderRadius: 36,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13, color: COLORS.textMuted, textAlign: "center",
    lineHeight: 20, fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    marginBottom: 16,
    padding: 4,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 10, borderRadius: 9, gap: 6,
  },
  tabActive: { backgroundColor: COLORS.background },
  tabText: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.cardBorder, padding: 20,
  },
  label: { fontSize: 12, fontWeight: "800", color: COLORS.text, marginBottom: 8 },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 12, paddingHorizontal: 14, height: 50,
  },
  countryCode: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginRight: 10 },
  divider: { width: 1, height: 22, backgroundColor: COLORS.cardBorder, marginRight: 10 },
  input: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: "600" },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 15,
    alignItems: "center", marginTop: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  otpTitle: { fontSize: 14, fontWeight: "800", color: COLORS.text, textAlign: "center" },
  otpSub: { fontSize: 12, color: COLORS.textMuted, textAlign: "center", marginTop: 4, marginBottom: 20 },
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  otpBox: {
    flex: 1, height: 54, borderRadius: 12,
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    fontSize: 22, fontWeight: "900", color: COLORS.text,
  },
  otpBoxFilled: { borderColor: COLORS.primary },
  resendRow: { alignItems: "center", marginTop: 16 },
  resendText: { fontSize: 13, color: COLORS.primary, fontWeight: "700" },
  terms: {
    textAlign: "center", fontSize: 11, color: COLORS.textDark,
    marginTop: 20, lineHeight: 16,
  },
});
