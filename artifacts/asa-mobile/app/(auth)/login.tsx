import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Alert, Platform, Image, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { authApi, ApiError } from '@/services/api';
import { saveSession, Session } from '@/services/auth';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Midnight Glass palette ────────────────────────────────────────────────────
const BG      = '#0A0F0D';
const SURFACE = 'rgba(255,255,255,0.07)';
const BORDER  = 'rgba(255,255,255,0.12)';
const NEON    = '#00E676';
const NEON2   = '#00BFA5';
const GOLD    = '#C9963F';
const WHITE   = '#FFFFFF';
const MUTED   = 'rgba(255,255,255,0.55)';
const RED     = '#EF4444';

export default function LoginScreen() {
  const insets    = useSafeAreaInsets();
  const { t }     = useLanguage();
  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword]             = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [loading, setLoading]               = useState(false);
  const [errors, setErrors]                 = useState<{ employeeNumber?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!/^\d{10}$/.test(employeeNumber)) next.employeeNumber = t('idRequired');
    if (!password)                         next.password       = t('passwordRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ nationalId: employeeNumber, password });
      const data = res.data!;
      await saveSession({
        token:        data.accessToken,
        refreshToken: data.refreshToken,
        role:         data.role as Session['role'],
        roles:        (data.roles ?? [data.role]) as Session['roles'],
        nameAr:       data.nameAr,
        employeeId:   data.employeeId,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (data.mustChangePassword) {
        router.replace({ pathname: '/(auth)/change-password', params: { role: data.role } } as any);
        return;
      }
      router.replace('/(tabs)');
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err instanceof ApiError ? err.message : t('loginFailed');
      Alert.alert(t('signInFailed'), msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ── Dark header with ambient glow ── */}
      <View style={[styles.topSection, { paddingTop: topPad + 28 }]}>
        {/* Ambient glow blobs */}
        <View style={styles.glow1} />
        <View style={styles.glow2} />

        {/* Logo with neon ring */}
        <View style={styles.logoRing}>
          <Image
            source={require('../../assets/images/asa-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.heading}>{t('welcomeBack')}</Text>
      </View>

      {/* ── Glass form card ── */}
      <View style={[styles.formCard, { paddingBottom: bottomPad + 24 }]}>

        {/* Employee Number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('nationalId')}</Text>
          <View style={[styles.inputRow, errors.employeeNumber ? styles.inputError : null]}>
            <Ionicons name="card-outline" size={18} color={errors.employeeNumber ? RED : NEON} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('nationalIdPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={employeeNumber}
              onChangeText={(t) => {
                setEmployeeNumber(t.replace(/\D/g, '').slice(0, 10));
                setErrors((e) => ({ ...e, employeeNumber: undefined }));
              }}
              keyboardType="number-pad"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              testID="input-employee-number"
            />
          </View>
          {errors.employeeNumber ? <Text style={styles.errorText}>{errors.employeeNumber}</Text> : null}
        </View>

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('password')}</Text>
          <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color={errors.password ? RED : NEON} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('passwordPlaceholder')}
              placeholderTextColor="rgba(255,255,255,0.25)"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setErrors((e) => ({ ...e, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              testID="input-password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={MUTED}
              />
            </TouchableOpacity>
          </View>
          {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        </View>

        {/* Forgot password */}
        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
        </TouchableOpacity>

        {/* Login button — neon gradient */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.88}
          testID="btn-login"
        >
          <LinearGradient
            colors={loading ? ['rgba(0,230,118,0.4)', 'rgba(0,191,165,0.4)'] : [NEON, NEON2]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.loginBtn}
          >
            <Text style={styles.loginBtnText}>{loading ? t('signingIn') : t('signIn')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register */}
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.82}
          testID="btn-go-register"
        >
          <Text style={styles.registerBtnText}>{t('noAccount')}</Text>
        </TouchableOpacity>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Ionicons name="lock-closed" size={11} color={NEON} />
          <Text style={styles.securityNoteText}>  HS512 JWT · BCrypt · Rate-limited</Text>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: BG },
  content:  { flexGrow: 1 },

  // ── Top section ──
  topSection: {
    backgroundColor: BG,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', top: -40, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(0,230,118,0.07)',
  },
  glow2: {
    position: 'absolute', bottom: 0, left: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(0,230,118,0.04)',
  },
  logoRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1.5, borderColor: 'rgba(0,230,118,0.35)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,230,118,0.08)',
    marginBottom: 20,
    shadowColor: NEON, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 8,
  },
  logo: { width: 72, height: 72, borderRadius: 36 },
  heading: {
    fontSize: 26, fontFamily: 'Inter_700Bold', color: WHITE,
    textAlign: 'right', letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 13, color: MUTED, marginTop: 6, textAlign: 'right',
  },

  // ── Glass form card ──
  formCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 18,
  },
  fieldGroup: { gap: 6 },
  label: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.75)', textAlign: 'right',
  },
  inputRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 14, paddingHorizontal: 14, height: 56,
  },
  inputError: { borderColor: RED },
  inputIcon:  { marginLeft: 10 },
  input: {
    flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: WHITE,
    ...Platform.select({ web: { outlineWidth: 0 } as any }),
  },
  eyeBtn:    { padding: 6 },
  errorText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: RED, marginTop: 2 },

  forgotBtn: { alignSelf: 'flex-start', marginTop: -4 },
  forgotText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: GOLD },

  loginBtn: {
    borderRadius: 16, paddingVertical: 17,
    alignItems: 'center',
    shadowColor: NEON, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
  },
  loginBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A0F0D' },

  divider:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: MUTED },

  registerBtn: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    backgroundColor: SURFACE,
  },
  registerBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: WHITE },

  securityNote: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 4,
  },
  securityNoteText: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(0,230,118,0.5)' },
});
