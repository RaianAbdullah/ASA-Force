/**
 * Attendance History — employee's paginated attendance log.
 * Accessed from the Home tab via "View History" button.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { attendanceApi, AttendanceResponse } from '@/services/api';
import colors from '@/constants/colors';

const { light, government } = colors;

const GREEN_DARK  = government.navyDark;  // "#0A4D2E"
const GREEN_MID   = government.navy;      // "#0D6B3F"
const GOLD        = government.gold;      // "#C9963F"
const CREAM       = light.background;    // "#F9FAF7"
const WHITE       = light.card;          // "#FFFFFF"
const TEXT        = light.text;          // "#1A1F1C"
const MUTED       = light.mutedForeground; // "#6B7A72"
const BORDER      = light.border;        // "#E4EBE7"

// Status chips: green / amber / red
const STATUS_META: Record<string, { label: string; labelAr: string; bg: string; text: string }> = {
  PRESENT: { label: 'Present',  labelAr: 'حاضر',  bg: '#22C55E' + '22', text: '#065F46' },
  LATE:    { label: 'Late',     labelAr: 'متأخر', bg: '#F59E0B' + '22', text: '#92400E' },
  ABSENT:  { label: 'Absent',   labelAr: 'غائب',  bg: '#EF4444' + '22', text: '#991B1B' },
  EXCUSED: { label: 'Excused',  labelAr: 'معذور', bg: GREEN_MID + '22', text: GREEN_DARK },
  HOLIDAY: { label: 'Holiday',  labelAr: 'إجازة', bg: BORDER,           text: MUTED },
};

function fmt(t?: string) {
  if (!t) return '—';
  return new Date(t).toLocaleTimeString('en-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtMins(mins?: number) {
  if (!mins || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function AttendanceCard({ item }: { item: AttendanceResponse }) {
  const meta = STATUS_META[item.status] ?? STATUS_META.ABSENT;
  const worked = fmtMins(item.workedMinutes);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>{item.attendanceDate}</Text>
          {item.minutesLate > 0 && (
            <Text style={styles.lateNote}>{item.minutesLate} min late</Text>
          )}
        </View>
        {/* Green/amber/red status chip */}
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.text }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Check-in</Text>
          <Text style={styles.timeValue}>{fmt(item.checkInTime)}</Text>
        </View>
        <Text style={styles.timeSep}>→</Text>
        <View style={styles.timeBlock}>
          <Text style={styles.timeLabel}>Check-out</Text>
          <Text style={styles.timeValue}>{fmt(item.checkOutTime)}</Text>
        </View>
        {worked && (
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>Worked</Text>
            <Text style={[styles.timeValue, { color: '#065F46' }]}>{worked}</Text>
          </View>
        )}
      </View>

      {item.shiftStart && (
        <Text style={styles.shiftNote}>
          Shift: {item.shiftStart.slice(0, 5)} – {item.shiftEnd?.slice(0, 5)}
          {item.geofenceOverride ? '  ⚠️ Override' : ''}
        </Text>
      )}
    </View>
  );
}

export default function AttendanceHistoryScreen() {
  const PAGE_SIZE = 25;

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['attendance', 'history'],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const r = await attendanceApi.getHistory(pageParam as number, PAGE_SIZE);
      return r.data!;
    },
    getNextPageParam: (lastPage) =>
      lastPage.last ? undefined : lastPage.number + 1,
  });

  const records = data?.pages.flatMap(p => p.content) ?? [];
  const total   = data?.pages[0]?.totalElements ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN_DARK} />

      {/* Header — navyDark bg, white text */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Attendance History</Text>
          <Text style={styles.titleAr}>سجل الحضور</Text>
        </View>
        {total > 0 && <Text style={styles.totalText}>{total} records</Text>}
      </View>

      {isLoading ? (
        <ActivityIndicator color={GREEN_MID} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item, idx) => item.id ?? `${item.attendanceDate}-${idx}`}
          renderItem={({ item }) => <AttendanceCard item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={GREEN_MID} />
          }
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color={GREEN_MID} style={{ margin: 16 }} /> : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Attendance Records</Text>
              <Text style={styles.emptyBody}>Your check-in history will appear here.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: CREAM },

  // Header — navyDark bg
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12,
                 paddingHorizontal: 16, paddingVertical: 16,
                 backgroundColor: GREEN_DARK },
  backBtn:     { padding: 4 },
  backText:    { color: GOLD, fontSize: 15, fontFamily: 'Inter_500Medium' },
  title:       { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#FFFFFF' },
  titleAr:     { fontSize: 12, color: 'rgba(255,255,255,0.65)' },
  totalText:   { fontSize: 13, color: 'rgba(255,255,255,0.65)' },

  list:        { padding: 16, paddingBottom: 60 },

  // White cards per record
  card:        { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 10,
                 borderWidth: 1, borderColor: BORDER,
                 shadowColor: '#0A4D2E', shadowOpacity: 0.10, shadowRadius: 16,
                 shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cardTop:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  date:        { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: TEXT },
  lateNote:    { fontSize: 12, color: '#92400E', marginTop: 2 },
  badge:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  badgeText:   { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  timeRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  timeBlock:   { alignItems: 'center', minWidth: 64 },
  timeLabel:   { fontSize: 11, color: MUTED, marginBottom: 2 },
  timeValue:   { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: TEXT },
  timeSep:     { color: MUTED, fontSize: 14 },

  shiftNote:   { fontSize: 12, color: MUTED, marginTop: 4 },

  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyIcon:   { fontSize: 56, marginBottom: 16 },
  emptyTitle:  { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: MUTED, marginBottom: 8 },
  emptyBody:   { fontSize: 14, color: MUTED, textAlign: 'center' },
});
