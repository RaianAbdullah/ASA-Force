/**
 * Schedule screen — Midnight Glass design
 */
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { scheduleApi, ScheduleDto } from '@/services/api';

// ── Midnight Glass palette ────────────────────────────────────────────────────
const BG      = '#0A0F0D';
const SURFACE = 'rgba(255,255,255,0.07)';
const BORDER  = 'rgba(255,255,255,0.12)';
const NEON    = '#00E676';
const GOLD    = '#C9963F';
const WHITE   = '#FFFFFF';
const MUTED   = 'rgba(255,255,255,0.55)';
const AMBER   = '#F59E0B';

const ALL_DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS_AR: Record<string, string> = {
  SUN: 'الأحد', MON: 'إثنين', TUE: 'ثلاثاء', WED: 'أربعاء',
  THU: 'خميس',  FRI: 'جمعة',  SAT: 'سبت',
};

const TODAY_DAY = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];

function formatTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const period = h < 12 ? 'ص' : 'م';
  const hour12 = h % 12 || 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function ScheduleCard({ schedule }: { schedule: ScheduleDto }) {
  const workSet = new Set(schedule.workDays.split(',').map(d => d.trim()));

  return (
    <View style={styles.card}>
      {/* Inner glow top-right */}
      <View style={styles.cardGlow} />

      {/* Shift times */}
      <View style={styles.shiftHeader}>
        <View style={styles.shiftBlock}>
          <View style={styles.shiftIconWrap}>
            <Text style={styles.shiftIcon}>🌙</Text>
          </View>
          <Text style={styles.shiftLabel}>انتهاء الوردية</Text>
          <Text style={styles.shiftTime}>{formatTime(schedule.shiftEnd)}</Text>
        </View>

        <View style={styles.shiftArrow}>
          <Text style={styles.shiftArrowText}>←</Text>
        </View>

        <View style={styles.shiftBlock}>
          <View style={[styles.shiftIconWrap, { backgroundColor: 'rgba(0,230,118,0.15)', borderColor: 'rgba(0,230,118,0.3)' }]}>
            <Text style={styles.shiftIcon}>☀️</Text>
          </View>
          <Text style={styles.shiftLabel}>بداية الوردية</Text>
          <Text style={[styles.shiftTime, { color: NEON }]}>{formatTime(schedule.shiftStart)}</Text>
        </View>
      </View>

      {/* Duration pill */}
      <View style={styles.durationPill}>
        <Text style={styles.durationText}>المدة الإجمالية</Text>
        <Text style={styles.durationValue}>٨ ساعات</Text>
      </View>

      {/* Work-day chips */}
      <Text style={styles.sectionLabel}>أيام العمل</Text>
      <View style={styles.dayGrid}>
        {ALL_DAYS.map(day => {
          const isWork  = workSet.has(day);
          const isToday = day === TODAY_DAY;
          return (
            <View
              key={day}
              style={[
                styles.dayChip,
                isWork  ? styles.dayChipWork  : styles.dayChipOff,
                isToday ? styles.dayChipToday : undefined,
              ]}
            >
              <Text style={[
                styles.dayChipAr,
                isWork  ? styles.dayChipTextWork  : styles.dayChipTextOff,
                isToday ? styles.dayChipTextToday : undefined,
              ]}>
                {DAY_LABELS_AR[day]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Status badges */}
      <View style={styles.badgeRow}>
        {schedule.todayIsWorkDay && (
          <View style={[styles.badge, { backgroundColor: 'rgba(0,230,118,0.12)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.3)' }]}>
            <Text style={[styles.badgeText, { color: NEON }]}>✓ يوم عمل اليوم</Text>
          </View>
        )}
        {!schedule.todayIsWorkDay && (
          <View style={[styles.badge, { backgroundColor: SURFACE }]}>
            <Text style={[styles.badgeText, { color: MUTED }]}>إجازة اليوم</Text>
          </View>
        )}
        {schedule.isWeekendDuty && (
          <View style={[styles.badge, { backgroundColor: 'rgba(201,150,63,0.12)', borderWidth: 1, borderColor: 'rgba(201,150,63,0.3)' }]}>
            <Text style={[styles.badgeText, { color: GOLD }]}>نوبة نهاية الأسبوع</Text>
          </View>
        )}
      </View>

      {schedule.notes && (
        <Text style={styles.notes}>📝 {schedule.notes}</Text>
      )}

      <Text style={styles.weekLabel}>أسبوع {schedule.weekStart}</Text>
    </View>
  );
}

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const { data: schedule, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['my-schedule'],
    queryFn: async () => {
      const res = await scheduleApi.getMySchedule();
      return res.data ?? null;
    },
    staleTime: 5 * 60_000,
  });

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerGlow} />
        <Text style={styles.title}>جدول العمل</Text>
        <Text style={styles.titleSub}>جدول الوردية الأسبوعي</Text>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={NEON} />}
      >
        {isLoading && (
          <ActivityIndicator color={NEON} style={{ marginTop: 60 }} />
        )}

        {!isLoading && !schedule && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>لا يوجد جدول بعد</Text>
            <Text style={styles.emptyBodyAr}>لم يتم تعيين جدول عمل بعد.{'\n'}يرجى التواصل مع مدير القسم.</Text>
          </View>
        )}

        {schedule && <ScheduleCard schedule={schedule} />}

        {!!error && (
          <Text style={styles.errorText}>فشل تحميل الجدول. اسحب للأسفل للمحاولة.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: BG },
  scrollArea:{ flex: 1 },
  scroll:    { padding: 20, paddingBottom: 80 },

  // Header
  header:    { backgroundColor: BG, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, overflow: 'hidden', position: 'relative' },
  headerGlow:{ position: 'absolute', top: -30, right: -20, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,230,118,0.06)' },
  title:     { fontSize: 26, fontFamily: 'Inter_700Bold', color: WHITE, textAlign: 'right' },
  titleSub:  { fontSize: 13, color: MUTED, marginTop: 4, textAlign: 'right' },

  // Card
  card: {
    backgroundColor: SURFACE, borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: BORDER, overflow: 'hidden', position: 'relative',
  },
  cardGlow: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(0,230,118,0.06)',
  },

  // Shift time display
  shiftHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  shiftBlock:  { flex: 1, alignItems: 'center', gap: 6 },
  shiftIconWrap: {
    width: 44, height: 44, borderRadius: 14, borderWidth: 1,
    borderColor: BORDER, backgroundColor: SURFACE,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  shiftIcon:   { fontSize: 20 },
  shiftLabel:  { fontSize: 11, color: MUTED, textAlign: 'center' },
  shiftTime:   { fontSize: 20, fontFamily: 'Inter_700Bold', color: WHITE, textAlign: 'center' },
  shiftArrow:  { paddingHorizontal: 12 },
  shiftArrowText: { fontSize: 22, color: GOLD },

  durationPill: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(0,230,118,0.07)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.2)',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 22,
  },
  durationText:  { fontSize: 13, color: MUTED },
  durationValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: NEON },

  sectionLabel: { fontSize: 11, color: MUTED, fontFamily: 'Inter_600SemiBold',
                  letterSpacing: 0.8, marginBottom: 12, textAlign: 'right', textTransform: 'uppercase' },
  dayGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  dayChip:      { borderRadius: 10, paddingVertical: 9, paddingHorizontal: 10, alignItems: 'center', minWidth: 48 },
  dayChipWork:  { backgroundColor: 'rgba(0,230,118,0.15)', borderWidth: 1, borderColor: 'rgba(0,230,118,0.3)' },
  dayChipOff:   { backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER },
  dayChipToday: { backgroundColor: 'rgba(0,230,118,0.25)', borderWidth: 1.5, borderColor: NEON },
  dayChipAr:    { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  dayChipTextWork:  { color: NEON },
  dayChipTextOff:   { color: MUTED },
  dayChipTextToday: { color: WHITE },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badge:    { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText:{ fontSize: 13, fontFamily: 'Inter_500Medium' },

  notes:    { fontSize: 14, color: MUTED, lineHeight: 20, marginBottom: 12, textAlign: 'right' },
  weekLabel:{ fontSize: 11, color: MUTED, textAlign: 'right' },

  emptyCard:  { backgroundColor: SURFACE, borderRadius: 22, padding: 36, alignItems: 'center',
                borderWidth: 1, borderColor: BORDER },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: WHITE, marginBottom: 10 },
  emptyBodyAr:{ fontSize: 13, color: MUTED, textAlign: 'center', lineHeight: 20 },
  errorText:  { textAlign: 'center', color: '#EF4444', marginTop: 24, fontSize: 14 },
});
