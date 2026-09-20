/**
 * Profile & Settings — Midnight Glass design
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/services/api';
import { loadSession, clearSession } from '@/services/auth';
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

const MANAGEMENT_ROLES = ['SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER', 'WEEKEND_MANAGER'];
const ROLE_LABELS: Record<string, string> = {
  SYSTEM_ADMIN:        'مدير النظام',
  MAIN_MANAGER:        'المدير العام',
  DEPARTMENT_MANAGER:  'مدير القسم',
  WEEKEND_MANAGER:     'مدير عطلة نهاية الأسبوع',
  EMPLOYEE:            'موظف',
};

export default function ProfileScreen() {
  const insets       = useSafeAreaInsets();
  const { t, locale, setLocale } = useLanguage();
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const [userName, setUserName] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadSession().then(s => {
      if (s) { setUserRole(s.role); setUserName(s.nameAr); }
    });
  }, []);


  const handleSignOut = useCallback(async () => {
    const current = await loadSession();
    try { await authApi.logout(current?.refreshToken); } catch { /* ignore */ }
    await clearSession();
    router.replace('/');
  }, []);

  const handleLanguageToggle = async () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    await setLocale(next);
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header — dark with neon avatar ring */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerGlow} />
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.userName} numberOfLines={2}>{userName ?? '—'}</Text>
          <Text style={styles.userRole}>{ROLE_LABELS[userRole ?? ''] ?? userRole ?? ''}</Text>
        </View>
        {/* Avatar with neon ring */}
        <View style={styles.avatarRing}>
          <LinearGradient colors={[GOLD, '#E8B86D']} style={styles.avatar}>
            <Text style={styles.avatarText}>{userName?.[0] ?? '?'}</Text>
          </LinearGradient>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Admin Panel */}
        {userRole && MANAGEMENT_ROLES.includes(userRole) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('administration')}</Text>
            <TouchableOpacity
              style={styles.adminRow}
              onPress={() => router.push('/(admin)' as any)}
              activeOpacity={0.8}
            >
              <View style={styles.adminIcon}>
                <Ionicons name="shield-checkmark" size={22} color={NEON} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminTitle}>{t('adminPanel')}</Text>
                <Text style={styles.adminSub}>{t('adminPanelDesc')}</Text>
              </View>
              <Ionicons name="chevron-back" size={18} color={GOLD} />
            </TouchableOpacity>
          </View>
        )}

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>
          <RowItem
            icon="lock-closed-outline"
            title={t('changePassword')}
            subtitle={t('changePasswordSubtitle')}
            onPress={() => router.push('/(tabs)/change-password')}
          />
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <TouchableOpacity style={styles.langRow} onPress={handleLanguageToggle} activeOpacity={0.8}>
            <Ionicons name="language-outline" size={22} color={NEON} style={styles.rowIconLeft} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{locale === 'ar' ? t('languageAr') : t('languageEn')}</Text>
              <Text style={styles.rowSub}>
                {locale === 'ar' ? `Switch to ${t('languageEn')}` : `التبديل إلى ${t('languageAr')}`}
              </Text>
            </View>
            <View style={[styles.langBadge, locale === 'ar' ? styles.langBadgeActive : styles.langBadgeInactive]}>
              <Text style={[styles.langBadgeText, locale === 'ar' ? styles.langBadgeTextActive : styles.langBadgeTextInactive]}>
                {locale.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Sign out */}
        <TouchableOpacity testID="btn-sign-out" style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={WHITE} />
          <Text style={styles.signOutText}>{t('signOut')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function RowItem({
  icon, title, subtitle, onPress,
}: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name={icon} size={22} color={NEON} style={styles.rowIconLeft} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-back" size={18} color={MUTED} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: BG },
  scroll: { padding: 16, paddingBottom: 60 },

  // Header
  header:     { flexDirection: 'row-reverse', alignItems: 'center', gap: 16,
                backgroundColor: BG, paddingHorizontal: 20, paddingBottom: 24,
                overflow: 'hidden', position: 'relative' },
  headerGlow: { position: 'absolute', top: -40, right: -20, width: 180, height: 180, borderRadius: 90,
                backgroundColor: 'rgba(0,230,118,0.06)' },
  avatarRing: {
    borderWidth: 2, borderColor: 'rgba(0,230,118,0.4)',
    borderRadius: 36, padding: 2,
    shadowColor: NEON, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  avatar:     { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 26, fontFamily: 'Inter_700Bold', color: '#0A0F0D' },
  userName:   { fontSize: 20, fontFamily: 'Inter_700Bold', color: WHITE, textAlign: 'right' },
  userRole:   { fontSize: 12, color: GOLD, marginTop: 3, textAlign: 'right' },

  // Sections — glass cards
  section:    { backgroundColor: SURFACE, borderRadius: 18, marginBottom: 14,
                borderWidth: 1, borderColor: BORDER, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: MUTED,
                  letterSpacing: 0.8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
                  textTransform: 'uppercase', textAlign: 'right' },

  adminRow:   { flexDirection: 'row-reverse', alignItems: 'center', padding: 16,
                backgroundColor: 'rgba(0,230,118,0.05)', gap: 12,
                borderTopWidth: 1, borderTopColor: BORDER },
  adminIcon:  { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(0,230,118,0.12)',
                alignItems: 'center', justifyContent: 'center' },
  adminTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: WHITE, textAlign: 'right' },
  adminSub:   { fontSize: 12, color: MUTED, marginTop: 2, textAlign: 'right' },

  row:         { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, gap: 12,
                 borderTopWidth: 1, borderTopColor: BORDER },
  rowIconLeft: { marginLeft: 2 },
  rowTitle:    { fontSize: 15, fontFamily: 'Inter_500Medium', color: WHITE, textAlign: 'right' },
  rowSub:      { fontSize: 12, color: MUTED, marginTop: 2, textAlign: 'right' },

  langRow:    { flexDirection: 'row-reverse', alignItems: 'center', padding: 16, gap: 12,
                borderTopWidth: 1, borderTopColor: BORDER },
  langBadge:  { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  langBadgeActive:   { backgroundColor: NEON },
  langBadgeInactive: { backgroundColor: SURFACE },
  langBadgeText:     { fontSize: 13, fontFamily: 'Inter_700Bold' },
  langBadgeTextActive:   { color: '#0A0F0D' },
  langBadgeTextInactive: { color: MUTED },

  emptyText: { textAlign: 'center', color: MUTED, padding: 16, fontSize: 14 },

  signOutBtn:  { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
                 gap: 8, backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: 16,
                 padding: 16, marginTop: 4, borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  signOutText: { color: WHITE, fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
