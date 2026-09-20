import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import colors from '@/constants/colors';
import { authApi, ApiError } from '@/services/api';

const { light, government } = colors;

const GREEN_DARK = government.navyDark;
const GREEN_MID  = government.navy;
const GOLD       = government.gold;
const CREAM      = light.background;
const WHITE      = light.card;
const TEXT       = light.text;
const MUTED      = light.mutedForeground;
const BORDER     = light.border;

const OTP_LENGTH = 6;

export default function VerifyOtpScreen() {
  const insets = useSafeAreaInsets();
  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { nationalId, maskedPhone } = useLocalSearchParams<{
    nationalId: string;
    maskedPhone?: string;
  }>();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear the cooldown interval when the screen unmounts
  useEffect(() => {
    return () => {
      if (cooldownRef.current !== null) {
        clearInterval(cooldownRef.current);
      }
    };
  }, []);

  const handleVerify = async () => {
    if (otp.length !== OTP_LENGTH) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Incomplete Code', 'Please enter the full 6-digit code.');
      return;
    }
    if (!nationalId) {
      Alert.alert('Error', 'Session expired. Please register again.');
      router.replace('/(auth)/register');
      return;
    }
    setLoading(true);
    try {
      await authApi.verifyOtp({ nationalId, otpCode: otp });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: '/(auth)/waiting', params: { nationalId } });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err instanceof ApiError ? err.message : 'Verification failed. Please try again.';
      Alert.alert('Verification Error', msg);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    // Clear any existing cooldown interval before starting a fresh one
    if (cooldownRef.current !== null) {
      clearInterval(cooldownRef.current);
    }
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading || !nationalId) return;
    setResendLoading(true);
    try {
      await authApi.resendOtp(nationalId);
      startResendCooldown();
      Alert.alert('Code Sent', 'A new verification code has been sent to your phone.');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not resend the code. Please try again.';
      Alert.alert('Resend Failed', msg);
    } finally {
      setResendLoading(false);
    }
  };

  // Render OTP digit boxes
  const digits = otp.split('').concat(Array(OTP_LENGTH - otp.length).fill(''));

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad + 24 }]}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      {/* Icon */}
      <View style={styles.iconBox}>
        <Ionicons name="mail-outline" size={36} color={GOLD} />
      </View>

      <Text style={styles.title}>Verify Your Phone</Text>
      <Text style={styles.titleAr}>تحقق من رقم هاتفك</Text>
      <Text style={styles.description}>
        {maskedPhone
          ? `We sent a 6-digit code to ${maskedPhone}`
          : 'We sent a 6-digit verification code to your phone.'}
        {'\n'}أرسلنا رمز تحقق مكون من 6 أرقام إلى هاتفك.
      </Text>

      {/* OTP digit display — white card */}
      <View style={styles.otpCard}>
        <TouchableOpacity
          style={styles.otpContainer}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          {digits.map((digit, i) => (
            <View
              key={i}
              style={[
                styles.digitBox,
                digit ? styles.digitBoxFilled : null,
                i === otp.length ? styles.digitBoxActive : null,
              ]}
            >
              <Text style={styles.digitText}>{digit || ''}</Text>
            </View>
          ))}
        </TouchableOpacity>
      </View>

      {/* Hidden real input */}
      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={otp}
        onChangeText={(t) => {
          const cleaned = t.replace(/\D/g, '').slice(0, OTP_LENGTH);
          setOtp(cleaned);
          if (cleaned.length === OTP_LENGTH) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        autoFocus
        testID="input-otp"
      />

      {/* Verify button */}
      <TouchableOpacity
        style={[styles.verifyBtn, (loading || otp.length !== OTP_LENGTH) && styles.verifyBtnDisabled]}
        onPress={handleVerify}
        disabled={loading || otp.length !== OTP_LENGTH}
        activeOpacity={0.82}
        testID="btn-verify"
      >
        <Text style={styles.verifyBtnText}>
          {loading ? 'Verifying...' : 'Verify Account — تحقق'}
        </Text>
      </TouchableOpacity>

      {/* Resend */}
      <View style={styles.resendRow}>
        <Text style={styles.resendLabel}>Didn't receive the code? </Text>
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          testID="btn-resend"
        >
          <Text style={[styles.resendBtn, (resendCooldown > 0 || resendLoading) && styles.resendBtnDisabled]}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendLoading ? 'Sending...' : 'Resend'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Security note */}
      <View style={styles.securityNote}>
        <Ionicons name="time-outline" size={13} color={MUTED} />
        <Text style={styles.securityText}>{'  '}Code expires in 5 minutes · الرمز ينتهي خلال 5 دقائق</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 99,
    backgroundColor: GREEN_MID,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 24,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: TEXT,
    textAlign: 'center',
  },
  titleAr: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  otpCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  otpContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  digitBox: {
    width: 44,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: CREAM,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitBoxFilled: {
    borderColor: GREEN_MID,
    backgroundColor: 'rgba(13,107,63,0.06)',
  },
  digitBoxActive: {
    borderColor: GOLD,
    borderWidth: 2,
  },
  digitText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: TEXT,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
  },
  verifyBtn: {
    backgroundColor: GREEN_MID,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    marginTop: 24,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  verifyBtnDisabled: {
    opacity: 0.45,
  },
  verifyBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: WHITE,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  resendLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
  },
  resendBtn: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: GOLD,
  },
  resendBtnDisabled: {
    color: MUTED,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  securityText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
    textAlign: 'center',
  },
});
