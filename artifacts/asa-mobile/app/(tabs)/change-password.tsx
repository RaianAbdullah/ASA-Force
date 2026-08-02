import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { authApi, ApiError } from '@/services/api';
import { clearSession } from '@/services/auth';

const NAVY   = '#1A2332';
const GOLD   = '#C9A84C';
const GRAY   = '#6B7280';
const BG     = '#F8F9FA';
const CARD   = '#FFFFFF';
const BORDER = '#E5E7EB';
const RED    = '#EF4444';

export default function ChangePasswordScreen() {
  const [current,    setCurrent]    = useState('');
  const [newPass,    setNewPass]    = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  const passwordMatch = newPass === confirm;
  const passwordLong  = newPass.length >= 8;
  const canSubmit     = current.length > 0 && passwordLong && passwordMatch;

  const handleChange = async () => {
    if (!canSubmit) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.changePassword(current, newPass);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Password Changed',
        'Your password has been updated. You have been signed out of all other devices.',
        [{
          text: 'OK',
          onPress: async () => {
            // Don't clear current session token — the server only revoked *other* refresh sessions.
            // User stays logged in on this device.
            router.back();
          },
        }]
      );
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof ApiError ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Change Password</Text>
        </View>

        <View style={styles.card}>
          {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}

          <View style={styles.field}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={current}
                onChangeText={setCurrent}
                secureTextEntry={!showPass}
                placeholder="Enter current password"
                returnKeyType="next"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              value={newPass}
              onChangeText={setNewPass}
              secureTextEntry={!showPass}
              placeholder="At least 8 characters"
              returnKeyType="next"
            />
            {newPass.length > 0 && !passwordLong &&
              <Text style={styles.hintError}>Password must be at least 8 characters</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPass}
              placeholder="Repeat new password"
              returnKeyType="done"
              onSubmitEditing={handleChange}
            />
            {confirm.length > 0 && !passwordMatch &&
              <Text style={styles.hintError}>Passwords do not match</Text>}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (!canSubmit || loading) && styles.disabledBtn]}
            onPress={handleChange}
            disabled={!canSubmit || loading}
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Updating…' : 'Update Password'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: BG },
  scroll:     { flexGrow: 1, padding: 20 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20, marginTop: 8 },
  backBtn:    { padding: 4 },
  backText:   { color: GOLD, fontSize: 16, fontFamily: 'Inter_500Medium' },
  title:      { fontSize: 22, fontFamily: 'Inter_700Bold', color: NAVY },
  card:       { backgroundColor: CARD, borderRadius: 16, padding: 24,
                shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  errorBox:   { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText:  { color: RED, fontSize: 14 },
  field:      { marginBottom: 16 },
  label:      { fontSize: 13, color: NAVY, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  input:      { borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 14, fontSize: 16,
                color: NAVY, backgroundColor: BG },
  passRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn:     { padding: 10 },
  eyeIcon:    { fontSize: 20 },
  hintError:  { color: RED, fontSize: 12, marginTop: 4 },
  primaryBtn: { backgroundColor: NAVY, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  disabledBtn:{ opacity: 0.5 },
});
