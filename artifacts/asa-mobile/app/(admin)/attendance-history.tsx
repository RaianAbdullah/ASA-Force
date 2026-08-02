import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi, DepartmentDto } from '@/services/api';
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
const STATUS_COLOR: Record<string, string> = {
  PRESENT: '#22C55E',
  LATE:    '#F59E0B',
  ABSENT:  '#EF4444',
  EXCUSED: '#6366f1',
};

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function displayDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export default function AttendanceHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [date, setDate]       = useState(formatDate(new Date()));
  const [deptId, setDeptId]   = useState<string | undefined>(undefined);
  const [showDepts, setShowDepts] = useState(false);

  const { data: deptRes } = useQuery({
    queryKey: ['departments'],
    queryFn:  () => adminApi.listDepartments(),
    staleTime: 5 * 60_000,
  });
  const departments: DepartmentDto[] = deptRes?.data ?? [];

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'attendance', date, deptId],
    queryFn:  () => adminApi.getAttendanceSummary(date, deptId),
    staleTime: 60_000,
  });
  const summary = data?.data;

  const prevDay = () => setDate(d => formatDate(addDays(new Date(d), -1)));
  const nextDay = () => {
    const next = addDays(new Date(date), 1);
    if (next <= new Date()) setDate(formatDate(next));
  };
  const isToday = date === formatDate(new Date());

  const selectedDept = departments.find(d => d.id === deptId);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header — navyDark bg */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Attendance History</Text>
          <Text style={styles.titleAr}>سجل الحضور</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Date navigator — white bar */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={prevDay} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={GREEN_MID} />
        </TouchableOpacity>
        <View style={styles.dateCenter}>
          <Text style={styles.dateText}>{displayDate(date)}</Text>
          {isToday && <Text style={styles.todayBadge}>Today</Text>}
        </View>
        <TouchableOpacity onPress={nextDay} style={[styles.navBtn, isToday && styles.navBtnDisabled]} disabled={isToday}>
          <Ionicons name="chevron-forward" size={22} color={isToday ? MUTED : GREEN_MID} />
        </TouchableOpacity>
      </View>

      {/* Department filter */}
      <TouchableOpacity style={styles.deptFilter} onPress={() => setShowDepts(v => !v)}>
        <Ionicons name="filter-outline" size={16} color={GREEN_MID} />
        <Text style={styles.deptFilterText}>{selectedDept ? selectedDept.nameAr : 'All Departments — جميع الأقسام'}</Text>
        <Ionicons name={showDepts ? 'chevron-up' : 'chevron-down'} size={16} color={GREEN_MID} />
      </TouchableOpacity>
      {showDepts && (
        <View style={styles.deptDropdown}>
          <TouchableOpacity style={styles.deptOption} onPress={() => { setDeptId(undefined); setShowDepts(false); }}>
            <Text style={[styles.deptOptionText, !deptId && styles.deptOptionSelected]}>All Departments</Text>
          </TouchableOpacity>
          {departments.map(d => (
            <TouchableOpacity key={d.id} style={styles.deptOption} onPress={() => { setDeptId(d.id); setShowDepts(false); }}>
              <Text style={[styles.deptOptionText, deptId === d.id && styles.deptOptionSelected]}>{d.nameAr}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={GREEN_MID} />}
      >
        {isLoading ? (
          <ActivityIndicator color={GREEN_MID} style={{ marginTop: 40 }} />
        ) : isError ? (
          <View style={styles.centered}>
            <Ionicons name="warning-outline" size={40} color={light.destructive} />
            <Text style={styles.errorText}>Failed to load attendance</Text>
            <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : summary ? (
          <>
            {/* Stats — white cards */}
            <View style={styles.statsRow}>
              {[
                { label: 'Total',   value: summary.totalActive, color: GREEN_MID },
                { label: 'Present', value: summary.checkedIn,   color: '#22C55E' },
                { label: 'Late',    value: summary.late,        color: '#F59E0B' },
                { label: 'Absent',  value: summary.absent,      color: '#EF4444' },
              ].map(s => (
                <View key={s.label} style={styles.statCard}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Records — white cards with status chips */}
            {summary.records.length === 0 ? (
              <View style={styles.centered}>
                <Ionicons name="calendar-outline" size={48} color={MUTED} />
                <Text style={styles.emptyText}>No records for this day</Text>
              </View>
            ) : (
              summary.records.map((rec: any) => (
                <View key={rec.id ?? rec.employeeId} style={styles.recordCard}>
                  {/* Status dot */}
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[rec.status] ?? MUTED }]} />
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordName}>{rec.firstNameAr} {rec.lastNameAr}</Text>
                    <Text style={styles.recordDept}>{rec.departmentNameAr}</Text>
                  </View>
                  <View style={styles.recordRight}>
                    {/* Status chip */}
                    <View style={[styles.statusChip,
                      { backgroundColor: (STATUS_COLOR[rec.status] ?? MUTED) + '1A' }]}>
                      <Text style={[styles.statusChipText, { color: STATUS_COLOR[rec.status] ?? MUTED }]}>
                        {rec.status}
                      </Text>
                    </View>
                    <Text style={styles.recordTime}>
                      {rec.checkInTime ? `In: ${rec.checkInTime}` : 'Absent'}
                    </Text>
                    {rec.minutesLate > 0 && (
                      <Text style={styles.lateLabel}>{rec.minutesLate}m late</Text>
                    )}
                  </View>
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: CREAM },

  // Header — navyDark
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        paddingHorizontal: 16, paddingVertical: 16,
                        backgroundColor: GREEN_DARK },
  backBtn:            { padding: 4 },
  title:              { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'center' },
  titleAr:            { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  // Date nav — white bar
  dateNav:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
                        backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER },
  navBtn:             { padding: 6 },
  navBtnDisabled:     { opacity: 0.3 },
  dateCenter:         { flex: 1, alignItems: 'center' },
  dateText:           { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: TEXT },
  todayBadge:         { fontSize: 11, fontFamily: 'Inter_700Bold', color: GREEN_MID, marginTop: 2 },

  // Dept filter
  deptFilter:         { flexDirection: 'row', alignItems: 'center', padding: 12, paddingHorizontal: 16,
                        backgroundColor: GREEN_MID + '10',
                        borderBottomWidth: 1, borderBottomColor: BORDER },
  deptFilterText:     { flex: 1, marginHorizontal: 8, fontSize: 13, fontFamily: 'Inter_600SemiBold', color: GREEN_MID },
  deptDropdown:       { backgroundColor: WHITE, borderBottomWidth: 1, borderBottomColor: BORDER },
  deptOption:         { padding: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: BORDER },
  deptOptionText:     { fontSize: 14, fontFamily: 'Inter_400Regular', color: TEXT },
  deptOptionSelected: { color: GREEN_MID, fontFamily: 'Inter_700Bold' },

  scroll:             { padding: 12, paddingBottom: 32 },

  // Stats row — white cards
  statsRow:           { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard:           { flex: 1, backgroundColor: WHITE, borderRadius: 14,
                        padding: 12, alignItems: 'center',
                        borderWidth: 1, borderColor: BORDER,
                        shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  statValue:          { fontSize: 22, fontFamily: 'Inter_700Bold' },
  statLabel:          { fontSize: 11, fontFamily: 'Inter_400Regular', color: MUTED, marginTop: 2 },

  // Record cards — white with status chips
  recordCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: WHITE,
                        borderRadius: 14, padding: 14, marginBottom: 8,
                        borderWidth: 1, borderColor: BORDER,
                        shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  statusDot:          { width: 10, height: 10, borderRadius: 5, marginRight: 12, flexShrink: 0 },
  recordInfo:         { flex: 1 },
  recordName:         { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: TEXT },
  recordDept:         { fontSize: 12, fontFamily: 'Inter_400Regular', color: MUTED },
  recordRight:        { alignItems: 'flex-end', gap: 3 },
  statusChip:         { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusChipText:     { fontSize: 10, fontFamily: 'Inter_700Bold' },
  recordTime:         { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEXT },
  lateLabel:          { fontSize: 11, fontFamily: 'Inter_400Regular', color: '#F59E0B' },

  centered:           { alignItems: 'center', marginTop: 60 },
  errorText:          { color: light.destructive, marginBottom: 12, fontFamily: 'Inter_400Regular' },
  retryBtn:           { backgroundColor: GREEN_MID, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10 },
  retryText:          { color: '#fff', fontFamily: 'Inter_600SemiBold' },
  emptyText:          { color: MUTED, marginTop: 12, fontFamily: 'Inter_400Regular' },
});
