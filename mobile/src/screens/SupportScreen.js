import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../api/client';
import { COLORS, SHADOWS } from '../constants/theme';

const CATEGORIES = ['Order Issue', 'Payment Problem', 'Wrong Item', 'Late Delivery', 'App Bug', 'Other'];

export default function SupportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('Order Issue');
  const [submitting, setSubmitting] = useState(false);

  async function submitTicket() {
    if (!subject.trim() || !message.trim()) {
      Alert.alert('Required Fields', 'Please fill in Subject and Message.');
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch('/support-tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          category,
        }),
      });
      Alert.alert(
        '✅ Ticket Submitted!',
        'Our team will respond within 2-4 hours via WhatsApp or SMS.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to submit ticket. Please try again or call: +91 94943 78247');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Quick Contact */}
        <View style={styles.quickCard}>
          <Ionicons name="headset-outline" size={24} color={COLORS.primary} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.quickTitle}>Quick Support</Text>
            <Text style={styles.quickSub}>Call or WhatsApp us directly for urgent issues</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callBtn}
          onPress={() => Alert.alert('Contact', 'Call/WhatsApp: +91 94943 78247')}
        >
          <Ionicons name="call-outline" size={16} color={COLORS.white} />
          <Text style={styles.callBtnTxt}>Call Support: +91 94943 78247</Text>
        </TouchableOpacity>

        {/* Ticket Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Submit a Support Ticket</Text>
          <Text style={styles.formSub}>We'll respond within 2-4 hours</Text>

          {/* Category */}
          <Text style={styles.fieldLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catPill, category === cat && styles.catPillActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catPillTxt, category === cat && styles.catPillTxtActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Subject */}
          <Text style={styles.fieldLabel}>Subject</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief summary of your issue"
            placeholderTextColor={COLORS.textDark}
            value={subject}
            onChangeText={setSubject}
          />

          {/* Message */}
          <Text style={styles.fieldLabel}>Message</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Describe your issue in detail... Include order ID if relevant."
            placeholderTextColor={COLORS.textDark}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <TouchableOpacity style={styles.submitBtn} onPress={submitTicket} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="send-outline" size={16} color={COLORS.white} />
                <Text style={styles.submitBtnTxt}>Submit Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* FAQs */}
        <View style={styles.faqCard}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          {[
            { q: 'How long does delivery take?', a: 'Usually 15-45 minutes depending on location.' },
            { q: 'Can I cancel my order?', a: 'Yes, within 2 minutes of placing. Contact support immediately.' },
            { q: 'How to top up wallet?', a: 'Use UPI to transfer and share screenshot with support.' },
            { q: 'My order is missing items?', a: 'Submit a ticket with your Order ID for quick resolution.' },
          ].map((faq, i) => (
            <View key={i} style={styles.faqItem}>
              <Text style={styles.faqQ}>Q: {faq.q}</Text>
              <Text style={styles.faqA}>{faq.a}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.cardBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: COLORS.text },
  scroll: { padding: 16, paddingBottom: 40 },

  quickCard: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10,
  },
  quickTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  quickSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  callBtn: {
    backgroundColor: COLORS.accent, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 8, marginBottom: 20,
  },
  callBtnTxt: { color: COLORS.white, fontWeight: '800', fontSize: 14 },

  formCard: {
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 16, marginBottom: 16, ...SHADOWS.small,
  },
  formTitle: { fontSize: 17, fontWeight: '900', color: COLORS.text },
  formSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2, marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: COLORS.textDark, marginBottom: 6, textTransform: 'uppercase' },
  catPill: {
    borderWidth: 1, borderColor: COLORS.cardBorder,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8,
  },
  catPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catPillTxt: { color: COLORS.textMuted, fontSize: 12, fontWeight: '700' },
  catPillTxtActive: { color: COLORS.white },
  input: {
    backgroundColor: COLORS.inputBg, borderWidth: 1, borderColor: COLORS.inputBorder,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: COLORS.text, fontSize: 14, marginBottom: 12,
  },
  textarea: { height: 110, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 14, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
  },
  submitBtnTxt: { color: COLORS.white, fontWeight: '900', fontSize: 15 },

  faqCard: {
    backgroundColor: COLORS.card, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.cardBorder,
    padding: 16, ...SHADOWS.small,
  },
  faqTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  faqItem: { marginBottom: 12 },
  faqQ: { fontSize: 13, fontWeight: '700', color: COLORS.text },
  faqA: { fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 17 },
});
