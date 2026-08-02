/**
 * ASA Workforce — Employee Home Screen (Midnight Glass design)
 */
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, RefreshControl, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loadSession, clearSession, Session } from '@/services/auth';
import { attendanceApi, authApi, AttendanceResponse, ApiError } from '@/services/api';
import { getCurrentLocation } from '@/services/location';
import { useLanguage } from '@/contexts/LanguageContext';

// ── Midnight Glass palette ───────────────────────────────────────────────────
const BG      = '#0A0F0D';
const SURFACE = 'rgba(255,255,255,0.07)';
const BORDER  = 'rgba(255,255,255,0.12)';
const NEON    = '#00E676';
const NEON2   = '#00BFA5';
const GOLD    = '#C9963F';
const WHITE   = '#FFFFFF';
const MUTED   = 'rgba(255,255,255,0.55)';
const AMBER   = '#F59E0B';
const RED     = '#EF4444';
const GREEN_PILL = '#22C55E';

// ── Live timer ────────────────────────────────────────────────────────────────
function useWorkTimer(checkInTime: string | undefined, checkOutTime: string | undefined) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!checkInTime || checkOutTime) {
      if (ref.current) clearInterval(ref.current);
      if (checkInTime && checkOutTime) {
        const diff = Math.floor(
          (new Date(checkOutTime).getTime() - new Date(checkInTime).getTime()) / 1000
        );
        setElapsed(diff);
      }
      return;
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - new Date(checkInTime).getTime()) / 1000));
    tick();
    ref.current = setInterval(tick, 1000);
    return () => { if (ref.current) clearInterval(ref.current); };
  }, [checkInTime, checkOutTime]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets  = useSafeAreaInsets();
  const qc      = useQueryClient();
  const { t }   = useLanguage();
  const [session, setSession] = useState<Session | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    loadSession().then((s) => {
      if (!s) { router.replace('/'); return; }
      setSession(s);
    });
  }, []);

  const ADMIN_ROLES = ['SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER'];
  const isAdmin = session
    ? (session.roles ?? [session.role]).some(r => ADMIN_ROLES.includes(r))
    : false;

  const { data: todayRes, isLoading, refetch, isRefetching } = useQuery({
    queryKey:  ['attendance', 'today'],
    queryFn:   () => attendanceApi.getToday(),
    enabled:   !!session,
    refetchInterval: 60_000,
  });
  const today: AttendanceResponse | undefined = todayRes?.data;
  const timer = useWorkTimer(today?.checkInTime, today?.checkOutTime);

  const checkInMutation = useMutation({
    mutationFn: async () => {
      setLocating(true);
      const coords = await getCurrentLocation().finally(() => setLocating(false));
      return attendanceApi.checkIn(coords.latitude, coords.longitude, false);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['attendance', 'today'] });
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message
                : typeof err === 'string' ? err
                : t('checkInFailed');
      Alert.alert(t('error'), msg);
    },
  });

  const handleCheckIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      t('confirmCheckIn'),
      t('gpsWillBeRecorded'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('checkIn'), onPress: () => checkInMutation.mutate() },
      ]
    );
  }, [checkInMutation]);

  const handleSignOut = useCallback(async () => {
    const current = await loadSession();
    try { await authApi.logout(current?.refreshToken); } catch { /* ignore */ }
    await clearSession();
    router.replace('/');
  }, []);

  if (!session || isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={NEON} size="large" />
      </View>
    );
  }

  const isBusy = locating || checkInMutation.isPending;

  const now = new Date();
  const hijriDate  = now.toLocaleDateString('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' });
  const miladiDate = now.toLocaleDateString('ar-SA-u-ca-gregory',  { day: 'numeric', month: 'long', year: 'numeric' });

  const roleLabel: Record<string, string> = {
    SYSTEM_ADMIN: 'مدير النظام',
    MAIN_MANAGER: 'المدير العام',
    DEPARTMENT_MANAGER: 'مدير القسم',
    EMPLOYEE: 'موظف',
  };

  const checkInFormatted = today?.checkInTime
    ? new Date(today.checkInTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 90 }]}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={NEON} />}
      >
        {/* ── Dark header with ambient glow ── */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          {/* Ambient glow blobs */}
          <View style={styles.glow1} />
          <View style={styles.glow2} />

          {/* Top row — RTL: actions LEFT, avatar+name RIGHT */}
          <View style={styles.headerRow}>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleSignOut} style={styles.iconBtn}>
                <Ionicons name="log-out-outline" size={22} color="rgba(255,255,255,0.55)" />
              </TouchableOpacity>
              {isAdmin && (
                <TouchableOpacity onPress={() => router.replace('/(admin)')} style={styles.iconBtn}>
                  <Ionicons name="shield-outline" size={22} color={GOLD} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.headerLeft}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.greeting}>أهلاً بك 👋</Text>
                <Text style={styles.name}>{session.nameAr}</Text>
                {(session.role in roleLabel) && (
                  <Text style={styles.roleBadge}>{roleLabel[session.role] ?? session.role}</Text>
                )}
              </View>
              {/* Gold neon avatar */}
              <View style={styles.avatarRing}>
                <LinearGradient
                  colors={[GOLD, '#E8B86D']}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{session.nameAr?.[0] ?? '?'}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Date strip — glass pill */}
          <View style={styles.dateStrip}>
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>هجري</Text>
              <Text style={styles.dateValue}>{hijriDate}</Text>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateBlock}>
              <Text style={styles.dateLabel}>ميلادي</Text>
              <Text style={styles.dateValue}>{miladiDate}</Text>
            </View>
            <View style={styles.dayBadge}>
              <View style={styles.dayDot} />
              <Text style={styles.dayBadgeText}>يوم عمل</Text>
            </View>
          </View>
        </View>

        {/* ── Glass status card (floats up) ── */}
        <View style={styles.floatingCard}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>{t('todaysStatus')}</Text>
            {today && (() => {
              const cfg = {
                PRESENT: { label: t('present'), color: NEON,  bg: 'rgba(0,230,118,0.15)',  border: 'rgba(0,230,118,0.3)' },
                LATE:    { label: t('late'),    color: AMBER, bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.3)' },
                ABSENT:  { label: t('absent'),  color: RED,   bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.3)' },
                EXCUSED: { label: t('excused'), color: NEON2, bg: 'rgba(0,191,165,0.15)',  border: 'rgba(0,191,165,0.3)' },
                HOLIDAY: { label: t('holiday'), color: MUTED, bg: SURFACE, border: BORDER },
              }[today.status] ?? { label: today.status, color: RED, bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.3)' };
              return (
                <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.statusPillText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
              );
            })()}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>{t('checkInTime')}</Text>
              <Text style={[styles.statValue, { color: NEON, fontSize: 22 }]}>{checkInFormatted}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>{t('duration')}</Text>
              <Text style={styles.statValue}>{today?.checkInTime ? timer : '—'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statLabel}>الوردية</Text>
              <Text style={styles.statValue}>
                {today?.shiftStart ? `${today.shiftStart.slice(0,5)}–${today.shiftEnd?.slice(0,5) ?? ''}` : '—'}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Check-in banner ── */}
        {today?.canCheckIn && (
          <TouchableOpacity
            testID="btn-check-in"
            onPress={handleCheckIn}
            disabled={isBusy}
            activeOpacity={0.88}
            style={styles.bannerWrap}
          >
            <LinearGradient
              colors={[NEON, NEON2]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.banner, isBusy && { opacity: 0.6 }]}
            >
              <View style={styles.bannerGlow} />
              <View style={styles.bannerIcon}>
                {isBusy
                  ? <ActivityIndicator color="#0A0F0D" />
                  : <Ionicons name="finger-print-outline" size={26} color="#0A0F0D" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>{t('checkIn')}</Text>
                <Text style={styles.bannerSub}>{t('gpsWillBeRecorded')}</Text>
              </View>
              <View style={styles.bannerBadge}>
                <Ionicons name="location-outline" size={16} color="#0A0F0D" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Shift not started yet */}
        {!today?.canCheckIn && !today?.checkInTime && today?.shiftStart && (
          <View style={styles.bannerWrap}>
            <View style={[styles.banner, { backgroundColor: 'rgba(245,158,11,0.12)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' }]}>
              <View style={styles.bannerIcon}>
                <Ionicons name="time-outline" size={26} color={AMBER} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: AMBER }]}>{t('shiftStartsAt')} {today.shiftStart.slice(0,5)}</Text>
                <Text style={[styles.bannerSub, { color: 'rgba(245,158,11,0.7)' }]}>{t('checkInOpens')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Already checked in */}
        {today?.checkInTime && !today?.canCheckIn && (
          <View style={styles.bannerWrap}>
            <View style={[styles.banner, { backgroundColor: 'rgba(0,230,118,0.10)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.25)' }]}>
              <View style={styles.bannerIcon}>
                <Ionicons name="checkmark-circle-outline" size={26} color={NEON} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bannerTitle, { color: NEON }]}>{t('attendanceRecorded')}</Text>
                <Text style={[styles.bannerSub, { color: MUTED }]}>{miladiDate} · {checkInFormatted}</Text>
              </View>
              <View style={[styles.bannerBadge, { backgroundColor: 'rgba(0,230,118,0.2)' }]}>
                <Ionicons name="checkmark" size={16} color={NEON} />
              </View>
            </View>
          </View>
        )}

        {locating && (
          <View style={styles.locatingRow}>
            <ActivityIndicator size="small" color={NEON} />
            <Text style={styles.locatingText}>{t('gettingLocation')}</Text>
          </View>
        )}

        {/* ── Quick access tiles ── */}
        <View style={styles.tiles}>
          {[
            { icon: 'bar-chart-outline',   label: 'سجل الحضور', color: NEON,  route: '/(tabs)/attendance-history' },
            { icon: 'airplane-outline',    label: 'إجازاتي',    color: GOLD,  route: '/(tabs)/vacations' },
            { icon: 'chatbubbles-outline', label: 'الرسائل',    color: '#60A5FA', route: '/(tabs)/messages' },
          ].map(tile => (
            <TouchableOpacity
              key={tile.label}
              style={[styles.tile, { borderColor: tile.color + '30' }]}
              onPress={() => router.push(tile.route as any)}
              activeOpacity={0.75}
            >
              <View style={[styles.tileIconWrap, { backgroundColor: tile.color + '15' }]}>
                <Ionicons name={tile.icon as any} size={26} color={tile.color} />
              </View>
              <Text style={[styles.tileLabel, { color: WHITE }]}>{tile.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Announcements card ── */}
        <TouchableOpacity
          style={styles.announcementsCard}
          onPress={() => router.push('/(tabs)/announcements' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.announcementsIconWrap}>
            <Ionicons name="megaphone-outline" size={22} color={GOLD} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.announcementsTitle}>الإشعارات والتبليغات</Text>
            <Text style={styles.announcementsSub}>اطلع على آخر تبليغات الإدارة</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={GOLD} />
        </TouchableOpacity>

        {today?.geofenceOverride && (
          <View style={styles.devNotice}>
            <Ionicons name="warning-outline" size={14} color={AMBER} />
            <Text style={styles.devNoticeText}>  Dev mode: geofence bypassed</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1, backgroundColor: BG },
  content:  { flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  // ── Header ──
  header: {
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  glow1: {
    position: 'absolute', top: -30, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(0,230,118,0.07)',
  },
  glow2: {
    position: 'absolute', bottom: -20, left: -20,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(201,150,63,0.05)',
  },

  headerRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn:       { padding: 8, borderRadius: 20, backgroundColor: SURFACE },

  avatarRing: {
    borderWidth: 1.5, borderColor: 'rgba(201,150,63,0.5)',
    borderRadius: 30, padding: 2,
  },
  avatar:     { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#0A0F0D' },
  greeting:   { fontSize: 12, color: MUTED, marginBottom: 3, textAlign: 'right' },
  name:       { fontSize: 18, fontFamily: 'Inter_700Bold', color: WHITE, textAlign: 'right' },
  roleBadge:  { fontSize: 11, fontFamily: 'Inter_500Medium', color: GOLD, marginTop: 3, textAlign: 'right' },

  // Date strip
  dateStrip:   { flexDirection: 'row', alignItems: 'center',
                 backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
                 borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10 },
  dateBlock:   { flex: 1, alignItems: 'center' },
  dateLabel:   { fontSize: 9, color: MUTED, letterSpacing: 0.4, marginBottom: 2 },
  dateValue:   { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.85)' },
  dateDivider: { width: 1, height: 28, backgroundColor: BORDER },
  dayBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dayDot:      { width: 7, height: 7, borderRadius: 4, backgroundColor: NEON },
  dayBadgeText:{ fontSize: 11, fontFamily: 'Inter_600SemiBold', color: NEON },

  // ── Floating status card ──
  floatingCard: {
    marginHorizontal: 16, marginTop: -8, zIndex: 2,
    backgroundColor: SURFACE, borderRadius: 22, padding: 20,
    borderWidth: 1, borderColor: BORDER,
    marginBottom: 14,
  },
  cardTop:    { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  cardLabel:  { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: MUTED, textAlign: 'right' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6,
                borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  statusDot:  { width: 8, height: 8, borderRadius: 4 },
  statusPillText: { fontSize: 13, fontFamily: 'Inter_700Bold' },

  statsRow:   { flexDirection: 'row', alignItems: 'center' },
  statBlock:  { flex: 1, alignItems: 'center', gap: 4 },
  statDivider:{ width: 1, height: 36, backgroundColor: BORDER, marginHorizontal: 4 },
  statLabel:  { fontSize: 10, color: MUTED, letterSpacing: 0.3 },
  statValue:  { fontSize: 17, fontFamily: 'Inter_700Bold', color: WHITE },

  // ── Banner ──
  bannerWrap: { marginHorizontal: 16, marginBottom: 14 },
  banner:     { borderRadius: 20, padding: 16, flexDirection: 'row-reverse', alignItems: 'center',
                gap: 14, overflow: 'hidden', position: 'relative' },
  bannerGlow: { position: 'absolute', top: -20, left: 40, width: 80, height: 80,
                borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.1)' },
  bannerIcon: { width: 48, height: 48, borderRadius: 24,
                backgroundColor: 'rgba(0,0,0,0.2)',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.2)', flexShrink: 0 },
  bannerTitle:{ fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A0F0D', marginBottom: 3 },
  bannerSub:  { fontSize: 12, color: 'rgba(10,15,13,0.65)' },
  bannerBadge:{ borderRadius: 10, padding: 8, flexShrink: 0, backgroundColor: 'rgba(0,0,0,0.15)' },

  // ── Quick tiles ──
  tiles: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 14 },
  tile:  { flex: 1, borderRadius: 18, borderWidth: 1,
           backgroundColor: SURFACE, paddingVertical: 14,
           alignItems: 'center', gap: 8 },
  tileIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontSize: 11, fontFamily: 'Inter_600SemiBold', textAlign: 'center', color: WHITE },

  // ── History link ──
  announcementsCard: {
   flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
   backgroundColor: 'rgba(201,150,63,0.08)',
   borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 8,
   borderWidth: 1, borderColor: 'rgba(201,150,63,0.22)',
 },
 announcementsIconWrap: {
   width: 44, height: 44, borderRadius: 22,
   backgroundColor: 'rgba(201,150,63,0.15)',
   alignItems: 'center', justifyContent: 'center', flexShrink: 0,
 },
 announcementsTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: WHITE, textAlign: 'right' },
 announcementsSub:   { fontSize: 12, color: MUTED, marginTop: 2, textAlign: 'right' },
 historyLink: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
                 marginHorizontal: 16, marginBottom: 8,
                 backgroundColor: SURFACE, borderRadius: 16, borderWidth: 1,
                 borderColor: BORDER, padding: 16 },
  historyLinkText: { flex: 1, fontSize: 14, fontFamily: 'Inter_500Medium', color: NEON },

  locatingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                 gap: 8, marginBottom: 12 },
  locatingText: { fontSize: 13, color: MUTED },

  devNotice:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                 marginTop: 4, opacity: 0.6 },
  devNoticeText: { fontSize: 11, color: AMBER },
});
