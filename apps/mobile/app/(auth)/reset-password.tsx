import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { authApi, ApiError } from '@/services/api';
import colors from '@/constants/colors';

const { light, government } = colors;

const GREEN_DARK = government.navyDark;
const GREEN_MID  = government.navy;
const GOLD       = government.gold;
const CREAM      = light.background;
const WHITE      = light.card;
const TEXT       = light.text;
const MUTED      = light.mutedForeground;
const BORDER     = light.border;
const RED        = light.destructive;

export default function ResetPasswordScreen() {
  const [resetToken,    setResetToken]    = useState('');
  const [newPassword,   setNewPassword]   = useState('');
  const [confirmPass,   setConfirmPass]   = useState('');
  const [showPass,      setShowPass]      = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');

  const passwordMatch = newPassword === confirmPass;
  const passwordLong  = newPassword.length >= 8;
  const canSubmit     = resetToken.trim().length > 0 && passwordLong && passwordMatch;

  const handleReset = async () => {
    if (!canSubmit) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.resetPassword(resetToken.trim(), newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Password Reset',
        'Your password has been reset successfully. Please sign in with your new password.',
        [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(err instanceof ApiError ? err.message : 'Reset failed. Please request a new code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>🔒</Text>
          </View>
          <Text style={styles.cardTitle}>Reset Password</Text>
          <Text style={styles.cardBody}>
            Enter the reset code provided by your IT administrator and your new password.
          </Text>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Reset Code</Text>
            <TextInput
              style={styles.input}
              value={resetToken}
              onChangeText={setResetToken}
              placeholder="Paste your reset code"
              placeholderTextColor={MUTED}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              testID="input-resetToken"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPass}
                placeholder="At least 8 characters"
                placeholderTextColor={MUTED}
                returnKeyType="next"
                testID="input-newPassword"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={MUTED}
                />
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && !passwordLong &&
              <Text style={styles.hintError}>Password must be at least 8 characters</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={confirmPass}
              onChangeText={setConfirmPass}
              secureTextEntry={!showPass}
              placeholder="Repeat new password"
              placeholderTextColor={MUTED}
              returnKeyType="done"
              onSubmitEditing={handleReset}
              testID="input-confirmPassword"
            />
            {confirmPass.length > 0 && !passwordMatch &&
              <Text style={styles.hintError}>Passwords do not match</Text>}
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, (!canSubmit || loading) && styles.disabledBtn]}
            onPress={handleReset}
            disabled={!canSubmit || loading}
            testID="btn-reset"
          >
            <Text style={styles.primaryBtnText}>{loading ? 'Resetting…' : 'Set New Password'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.linkBtn}>
            <Text style={styles.linkText}>Request a new code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: CREAM },
  scroll:     { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card:       {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 99,
    backgroundColor: GREEN_MID,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconEmoji:  { fontSize: 32 },
  cardTitle:  { fontSize: 22, fontFamily: 'Inter_700Bold', color: TEXT, marginBottom: 10, textAlign: 'center' },
  cardBody:   { fontSize: 15, color: MUTED, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  errorBox:   { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, width: '100%', marginBottom: 16,
                borderWidth: 1, borderColor: '#FECACA' },
  errorText:  { color: RED, fontSize: 14 },
  field:      { width: '100%', marginBottom: 16 },
  label:      { fontSize: 13, color: TEXT, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
  input:      {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
    fontSize: 16,
    color: TEXT,
    backgroundColor: WHITE,
  },
  passRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn:     { padding: 10 },
  hintError:  { color: RED, fontSize: 12, marginTop: 4 },
  primaryBtn: {
    width: '100%',
    backgroundColor: GREEN_MID,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryBtnText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  disabledBtn:    { opacity: 0.5 },
  linkBtn:        { marginTop: 16, padding: 8 },
  linkText:       { color: GOLD, fontSize: 14, fontFamily: 'Inter_500Medium' },
});
