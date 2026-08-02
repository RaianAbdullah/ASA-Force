import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { adminAttendanceApi, AdminAttendanceSummary, ApiError } from '@/services/api';
import colors from '@/constants/colors';

const { light, government } = colors;
const GREEN_DARK = government.navyDark;  // "#0A4D2E"
const GREEN_MID  = government.navy;      // "#0D6B3F"
const GOLD       = government.gold;      // "#C9963F"
const CREAM      = light.background;    // "#F9FAF7"
const WHITE      = light.card;          // "#FFFFFF"
const TEXT       = light.text;          // "#1A1F1C"
const MUTED      = light.mutedForeground; // "#6B7A72"
const BORDER     = light.border;        // "#E4EBE7"

// Status colors per spec
const GREEN  = '#22C55E';  // PRESENT
const AMBER  = '#F59E0B';  // LATE

type Row = AdminAttendanceSummary['records'][number];

function statusColor(status: string) {
  if (status === 'PRESENT') return GREEN;
  if (status === 'LATE')    return AMBER;
  return MUTED;
}

function statusLabel(status: string) {
  if (status === 'PRESENT') return 'حاضر';
  if (status === 'LATE')    return 'متأخر';
  return status;
}

function formatWorked(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function EmployeeRow({ item }: { item: Row }) {
  const isCheckedOut = !!item.checkOutTime;
  return (
    <View style={[styles.card, isCheckedOut && styles.cardOut]}>
      {/* Green on-duty dot indicator */}
      {!isCheckedOut && <View style={styles.onDutyDot} />}

      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: isCheckedOut ? MUTED + '40' : GREEN_MID }]}>
        <Text style={styles.avatarText}>{item.firstNameAr?.[0] ?? '?'}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{item.firstNameAr} {item.lastNameAr}</Text>
        <Text style={styles.dept}>{item.departmentNameAr ?? item.departmentNameEn ?? '—'}</Text>
        <View style={styles.timeRow}>
          <Feather name="log-in" size={12} color={GREEN} />
          <Text style={styles.timeText}>{item.checkInTime ?? '—'}</Text>
          {isCheckedOut && (
            <>
              <Feather name="log-out" size={12} color={MUTED} style={{ marginLeft: 10 }} />
              <Text style={[styles.timeText, { color: MUTED }]}>{item.checkOutTime}</Text>
            </>
          )}
          {!isCheckedOut && formatWorked(item.workedMinutes) && (
            <Text style={styles.worked}>· {formatWorked(item.workedMinutes)}</Text>
          )}
        </View>
      </View>

      {/* Status badge */}
      <View style={[styles.badge, { backgroundColor: isCheckedOut ? BORDER : statusColor(item.status) + '1A' }]}>
        <Text style={[styles.badgeText, { color: isCheckedOut ? MUTED : statusColor(item.status) }]}>
          {isCheckedOut ? 'انتهى' : statusLabel(item.status)}
        </Text>
      </View>
    </View>
  );
}

export default function OnDutyScreen() {
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'attendance', 'today'],
    queryFn:  () => adminAttendanceApi.getTodaySummary(),
    refetchInterval: 60_000,
  });

  const summary = data?.data;

  // All employees who checked in today — on-duty first, then checked-out
  const rows: Row[] = useMemo(() => {
    if (!summary?.records) return [];
    const checkedIn  = summary.records.filter((r: Row) => !!r.checkInTime);
    const onDuty     = checkedIn.filter((r: Row) => !r.checkOutTime);
    const checkedOut = checkedIn.filter((r: Row) =>  !!r.checkOutTime);
    return [...onDuty, ...checkedOut];
  }, [summary]);

  const onDutyCount = rows.filter(r => !r.checkOutTime).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header — navyDark bg */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>On Duty</Text>
          <Text style={styles.subtitle}>من هم في العمل الآن</Text>
        </View>
        {summary && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{onDutyCount}</Text>
            <Text style={styles.countLabel}>on duty</Text>
          </View>
        )}
      </View>

      {/* Summary strip — white cards on cream */}
      {summary && (
        <View style={styles.strip}>
          <StatPill label="Present"  value={summary.checkedIn - summary.late} color={GREEN} />
          <StatPill label="Late"     value={summary.late}                      color={AMBER} />
          <StatPill label="Absent"   value={summary.absent}                    color={light.destructive} />
          <StatPill label="Total"    value={summary.totalActive}               color={GREEN_MID} />
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={GREEN_MID} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="warning-outline" size={48} color={light.destructive} />
          <Text style={styles.errorText}>Failed to load attendance</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={item => item.id ?? item.employeeId}
          contentContainerStyle={[
            styles.list,
            rows.length === 0 && styles.emptyList,
            { paddingBottom: insets.bottom + 24 },
          ]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={GREEN_MID} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={56} color={GREEN_MID} style={{ opacity: 0.25 }} />
              <Text style={styles.emptyTitle}>No one checked in yet</Text>
              <Text style={styles.emptySubtitle}>لم يسجّل أحد حضوره اليوم</Text>
            </View>
          }
          renderItem={({ item }) => <EmployeeRow item={item} />}
        />
      )}
    </View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.pill, { borderColor: color + '40' }]}>
      <Text style={[styles.pillValue, { color }]}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: CREAM },

  // Header — navyDark
  header:      { flexDirection: 'row', alignItems: 'center', gap: 10,
                 paddingHorizontal: 16, paddingVertical: 16,
                 backgroundColor: GREEN_DARK },
  backBtn:     { padding: 4, marginRight: 2 },
  title:       { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  subtitle:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  countBadge:  { alignItems: 'center', backgroundColor: GREEN + '20',
                 borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6,
                 borderWidth: 1, borderColor: GREEN + '40' },
  countText:   { fontSize: 22, fontFamily: 'Inter_700Bold', color: GREEN },
  countLabel:  { fontSize: 10, fontFamily: 'Inter_500Medium', color: GREEN },

  // Summary strip — white pills on cream
  strip:       { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: CREAM },
  pill:        { flex: 1, alignItems: 'center', borderRadius: 12, paddingVertical: 10,
                 borderWidth: 1, backgroundColor: WHITE,
                 shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 2 },
                 shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  pillValue:   { fontSize: 18, fontFamily: 'Inter_700Bold' },
  pillLabel:   { fontSize: 10, fontFamily: 'Inter_500Medium', color: MUTED, marginTop: 1 },

  list:        { padding: 14, gap: 10 },
  emptyList:   { flex: 1 },

  // White cards with green on-duty dot indicator
  card:        { flexDirection: 'row', alignItems: 'center', gap: 12,
                 backgroundColor: WHITE, borderRadius: 16, padding: 14,
                 borderWidth: 1, borderColor: BORDER,
                 shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 6 },
                 shadowOpacity: 0.10, shadowRadius: 16, elevation: 4 },
  cardOut:     { opacity: 0.6 },

  // Green dot for "on duty"
  onDutyDot:   { position: 'absolute', top: 12, right: 12,
                 width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },

  avatar:      { width: 44, height: 44, borderRadius: 99,
                 alignItems: 'center', justifyContent: 'center' },
  avatarText:  { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  name:        { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: TEXT },
  dept:        { fontSize: 12, fontFamily: 'Inter_400Regular', color: MUTED, marginTop: 1 },
  timeRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  timeText:    { fontSize: 12, fontFamily: 'Inter_500Medium', color: GREEN },
  worked:      { fontSize: 12, fontFamily: 'Inter_400Regular', color: MUTED },
  badge:       { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:   { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  centered:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  errorText:   { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: light.destructive },
  retryBtn:    { backgroundColor: GREEN_MID, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  retryText:   { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#fff' },
  emptyTitle:  { fontSize: 18, fontFamily: 'Inter_700Bold', color: TEXT },
  emptySubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', color: MUTED },
});
