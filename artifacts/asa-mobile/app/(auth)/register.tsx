import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
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

type FormData = {
  firstNameAr: string;
  middleNameAr: string;
  lastNameAr: string;
  employeeNumber: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [form, setForm] = useState<FormData>({
    firstNameAr: '',
    middleNameAr: '',
    lastNameAr: '',
    employeeNumber: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const update = (key: keyof FormData) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.firstNameAr.trim()) next.firstNameAr = 'Required / مطلوب';
    if (!form.lastNameAr.trim()) next.lastNameAr = 'Required / مطلوب';
    if (!/^\d{10}$/.test(form.employeeNumber)) next.employeeNumber = 'ID number must be exactly 10 digits';
    if (!form.phoneNumber.trim()) next.phoneNumber = 'Required / مطلوب';
    if (form.password.length < 12) next.password = 'Minimum 12 characters / 12 أحرف على الأقل';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        nationalId:   form.employeeNumber,
        firstNameAr:  form.firstNameAr.trim(),
        middleNameAr: form.middleNameAr.trim() || undefined,
        lastNameAr:   form.lastNameAr.trim(),
        phoneNumber:  form.phoneNumber.trim(),
        password:     form.password,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Pass nationalId so verify-otp can call the correct endpoint
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { nationalId: form.employeeNumber, maskedPhone: res.data?.maskedPhone ?? '' },
      });
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err instanceof ApiError ? err.message : 'Registration failed. Please try again.';
      Alert.alert('Registration Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (
    key: keyof FormData,
    label: string,
    labelAr: string,
    options: {
      placeholder?: string;
      keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad';
      autoCapitalize?: 'none' | 'words' | 'characters';
      secureTextEntry?: boolean;
      toggleSecure?: () => void;
      showSecure?: boolean;
      autoCorrect?: boolean;
    } = {}
  ) => (
    <View style={styles.fieldGroup} key={key}>
      <Text style={styles.label}>
        {label} <Text style={styles.labelAr}>{labelAr}</Text>
      </Text>
      <View style={[styles.inputRow, errors[key] ? styles.inputError : null]}>
        <TextInput
          style={styles.input}
          placeholder={options.placeholder ?? label}
          placeholderTextColor={MUTED}
          value={form[key]}
          onChangeText={update(key)}
          keyboardType={options.keyboardType ?? 'default'}
          autoCapitalize={options.autoCapitalize ?? 'words'}
          autoCorrect={options.autoCorrect ?? false}
          secureTextEntry={options.secureTextEntry && !options.showSecure}
          testID={`input-${key}`}
        />
        {options.toggleSecure ? (
          <TouchableOpacity onPress={options.toggleSecure} style={styles.eyeBtn}>
            <Ionicons
              name={options.showSecure ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={MUTED}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
    </View>
  );

  return (
    <KeyboardAwareScrollViewCompat
      style={styles.scroll}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />

      {/* ── Green top section ── */}
      <View style={[styles.topSection, { paddingTop: topPad + 24 }]}>
        <Image
          source={require('../../assets/images/asa-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.topHeading}>New Employee Registration</Text>
        <Text style={styles.topSubheading}>تسجيل موظف جديد</Text>
      </View>

      {/* ── Cream form area ── */}
      <View style={[styles.formArea, { paddingBottom: bottomPad + 24 }]}>
        <Text style={styles.sectionTitle}>Personal Information / المعلومات الشخصية</Text>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            {renderField('firstNameAr', 'الاسم الأول', 'First Name (AR)', { autoCapitalize: 'words' })}
          </View>
          <View style={{ flex: 1 }}>
            {renderField('lastNameAr', 'اسم العائلة', 'Last Name (AR)', { autoCapitalize: 'words' })}
          </View>
        </View>

        {renderField('middleNameAr', 'الاسم الأوسط (اختياري)', 'Middle Name (AR) — optional', { autoCapitalize: 'words' })}

        {renderField('employeeNumber', 'ID Number', 'رقم الهوية', {
          placeholder: '10-digit national ID',
          keyboardType: 'number-pad',
          autoCapitalize: 'none',
        })}

        {renderField('phoneNumber', 'Phone Number', 'رقم الهاتف', {
          placeholder: '+966 5X XXX XXXX',
          keyboardType: 'phone-pad',
          autoCapitalize: 'none',
        })}

        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
          Set Password / إنشاء كلمة مرور
        </Text>

        {renderField('password', 'Password', 'كلمة المرور', {
          placeholder: 'Minimum 12 characters',
          secureTextEntry: true,
          showSecure: showPassword,
          toggleSecure: () => setShowPassword(!showPassword),
          autoCapitalize: 'none',
        })}

        {renderField('confirmPassword', 'Confirm Password', 'تأكيد كلمة المرور', {
          placeholder: 'Re-enter password',
          secureTextEntry: true,
          showSecure: showConfirm,
          toggleSecure: () => setShowConfirm(!showConfirm),
          autoCapitalize: 'none',
        })}

        {/* Password requirements */}
        <View style={styles.passwordHints}>
          <Ionicons name="information-circle-outline" size={14} color={MUTED} />
          <Text style={styles.hintText}>
            {'  '}Minimum 12 characters. Include uppercase, lowercase, numbers, and symbols.
          </Text>
        </View>

        {/* Privacy notice */}
        <View style={styles.notice}>
          <Ionicons name="shield-outline" size={14} color={GREEN_MID} />
          <Text style={styles.noticeText}>
            {'  '}Your data is protected and used only for workforce management purposes.
            {'\n  '}بياناتك محمية وتُستخدم فقط لأغراض إدارة القوى العاملة.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.82}
          testID="btn-register"
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Submitting...' : 'Submit Registration — تقديم الطلب'}
          </Text>
        </TouchableOpacity>

        {/* Sign in link */}
        <TouchableOpacity
          style={styles.signinLink}
          onPress={() => router.back()}
        >
          <Text style={styles.signinLinkText}>
            Already registered? Sign In / لديك حساب؟ تسجيل الدخول
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: GREEN_DARK,
  },
  content: {
    flexGrow: 1,
  },
  topSection: {
    backgroundColor: GREEN_DARK,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    marginBottom: 14,
  },
  topHeading: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: WHITE,
    textAlign: 'center',
  },
  topSubheading: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.70)',
    marginTop: 4,
    textAlign: 'center',
  },
  formArea: {
    flex: 1,
    backgroundColor: CREAM,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: GREEN_MID,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT,
  },
  labelAr: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
    fontWeight: '400',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 54,
  },
  inputError: {
    borderColor: light.destructive,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: TEXT,
    outlineWidth: 0,
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: light.destructive,
  },
  passwordHints: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: light.muted,
    borderRadius: 10,
    padding: 10,
    marginTop: -4,
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
    flex: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(13,107,63,0.06)',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: GREEN_MID,
  },
  noticeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: TEXT,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
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
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: WHITE,
  },
  signinLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  signinLinkText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: GOLD,
  },
});
