/**
 * ASA Workforce — Welcome / Landing Screen (Midnight Glass design)
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// ── Midnight Glass palette ────────────────────────────────────────────────────
const BG      = '#0A0F0D';
const SURFACE = 'rgba(255,255,255,0.07)';
const BORDER  = 'rgba(255,255,255,0.12)';
const NEON    = '#00E676';
const NEON2   = '#00BFA5';
const GOLD    = '#C9963F';
const WHITE   = '#FFFFFF';
const MUTED   = 'rgba(255,255,255,0.55)';

export default function WelcomeScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* ── Ambient glow blobs ── */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />
      <View style={styles.glow3} />

      {/* ── Upper hero area ── */}
      <View style={[styles.hero, { paddingTop: topPad + 48 }]}>

        {/* Logo with neon ring */}
        <View style={styles.logoRingOuter}>
          <View style={styles.logoRing}>
            <Image
              source={require('../assets/images/asa-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Gold divider line */}
        <View style={styles.goldLine} />

        {/* Government identity text */}
        <View style={styles.textBlock}>
          <Text style={styles.line1}>المملكة العربية السعودية</Text>
          <Text style={styles.line2}>وكالة وزارة الداخلية للشؤون الأمنية</Text>
          <Text style={styles.line3}>إدارة العمليات الأمنية</Text>
        </View>
      </View>

      {/* ── Glass bottom card ── */}
      <View style={[styles.card, { paddingBottom: bottomPad + 24 }]}>

        {/* Card handle */}
        <View style={styles.handle} />

        {/* Tagline */}
        <Text style={styles.tagline}>بوابة الموظفين الرقمية</Text>

        {/* Primary — neon gradient login button */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.88}
          style={styles.primaryWrap}
        >
          <LinearGradient
            colors={[NEON, NEON2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtn}
          >
            <Ionicons name="finger-print-outline" size={20} color="#0A0F0D" style={{ marginLeft: 8 }} />
            <Text style={styles.primaryBtnText}>تسجيل الدخول</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Secondary — glass register button */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.82}
        >
          <Text style={styles.secondaryBtnText}>تسجيل جديد</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Ionicons name="lock-closed" size={11} color={NEON} />
          <Text style={styles.footer}>  للاستخدام الداخلي فقط</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  // ── Ambient glows ──
  glow1: {
    position: 'absolute', top: -60, right: -60,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(0,230,118,0.07)',
    pointerEvents: 'none',
  },
  glow2: {
    position: 'absolute', top: 160, left: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(0,191,165,0.05)',
    pointerEvents: 'none',
  },
  glow3: {
    position: 'absolute', bottom: 200, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(201,150,63,0.04)',
    pointerEvents: 'none',
  },

  // ── Hero ──
  hero: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
  },

  logoRingOuter: {
    width: 148, height: 148, borderRadius: 74,
    borderWidth: 1, borderColor: 'rgba(0,230,118,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 28,
  },
  logoRing: {
    width: 128, height: 128, borderRadius: 64,
    borderWidth: 1.5, borderColor: 'rgba(0,230,118,0.45)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,230,118,0.06)',
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 10,
  },
  logo: {
    width: 98, height: 98, borderRadius: 49,
  },

  goldLine: {
    width: 40, height: 2, borderRadius: 1,
    backgroundColor: GOLD, marginBottom: 20, opacity: 0.7,
  },

  textBlock: {
    alignItems: 'center',
    gap: 6,
  },
  line1: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: WHITE,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  line2: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  line3: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 0.3,
  },

  // ── Glass card ──
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 14,
  },

  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: BORDER,
    alignSelf: 'center',
    marginBottom: 8,
  },

  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: MUTED,
    textAlign: 'center',
    marginBottom: 4,
  },

  primaryWrap: {
    shadowColor: NEON,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 17,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#0A0F0D',
  },

  secondaryBtn: {
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: SURFACE,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: WHITE,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  footer: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
    textAlign: 'center',
  },
});
