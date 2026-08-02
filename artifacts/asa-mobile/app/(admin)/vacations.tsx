/**
 * Admin/Manager — Vacation Request Management
 *
 * Two-stage approval chain:
 *   - DEPARTMENT_MANAGER sees PENDING_DEPT_MANAGER requests for their dept.
 *     Approve → advances to PENDING_MAIN_MANAGER. Reject → REJECTED.
 *   - MAIN_MANAGER / SYSTEM_ADMIN sees PENDING_MAIN_MANAGER requests.
 *     Approve → APPROVED. Reject → REJECTED.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vacationApi, VacationRequestDto, ApiError } from '@/services/api';
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
const RED        = light.destructive;   // "#EF4444"
const GREEN      = '#22C55E';

type TabKey = 'pending' | 'all';

// Status chips: PENDING=gold, APPROVED=green, REJECTED=red
const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
  PENDING_DEPT_MANAGER:  { bg: GOLD + '22',    text: GOLD,       label: 'Awaiting Dept. Manager' },
  PENDING_MAIN_MANAGER:  { bg: GOLD + '22',    text: GOLD,       label: 'Awaiting Main Manager' },
  APPROVED:              { bg: GREEN + '1A',   text: GREEN_MID,  label: 'Approved' },
  REJECTED:              { bg: RED + '1A',     text: RED,        label: 'Rejected' },
  CANCELLED:             { bg: BORDER,         text: MUTED,      label: 'Cancelled' },
};

export default function AdminVacationsScreen() {
  const qc = useQueryClient();
  const [tab, setTab]   = useState<TabKey>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: pending = [], isLoading: loadingPending, refetch: refetchPending, isFetching: fetchingPending } = useQuery({
    queryKey: ['admin', 'vacations', 'pending'],
    queryFn:  async () => { const r = await vacationApi.getPending(); return r.data ?? []; },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: all = [], isLoading: loadingAll, refetch: refetchAll, isFetching: fetchingAll } = useQuery({
    queryKey: ['admin', 'vacations', 'all'],
    queryFn:  async () => { const r = await vacationApi.getAll(); return r.data ?? []; },
    staleTime: 30_000,
    enabled: tab === 'all',
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => vacationApi.approve(id, note),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['admin', 'vacations'] });
    },
    onError: (err) => Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => vacationApi.reject(id, note),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['admin', 'vacations'] });
    },
    onError: (err) => Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to reject'),
  });

  const approveLabel = (status: string) =>
    status === 'PENDING_DEPT_MANAGER' ? '✓ Forward to Manager' : '✓ Final Approve';

  const confirmApprove = (req: VacationRequestDto) => {
    const action = req.status === 'PENDING_DEPT_MANAGER'
      ? 'forward this request to the main manager'
      : 'give final approval for this vacation';
    Alert.alert(
      'Approve Vacation',
      `${req.employeeNameAr} · ${req.totalDays} day(s)\n${req.startDate} → ${req.endDate}\n\nThis will ${action}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Approve', onPress: () => approveMutation.mutate({ id: req.id, note: notes[req.id] }) },
      ]
    );
  };

  const confirmReject = (req: VacationRequestDto) => {
    Alert.alert(
      'Reject Vacation',
      `Reject vacation request for ${req.employeeNameAr}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive',
          onPress: () => rejectMutation.mutate({ id: req.id, note: notes[req.id] }) },
      ]
    );
  };

  const displayList = tab === 'pending' ? pending : all;
  const isLoading   = tab === 'pending' ? loadingPending : loadingAll;
  const isFetching  = tab === 'pending' ? fetchingPending : fetchingAll;
  const doRefetch   = tab === 'pending' ? refetchPending : refetchAll;

  const isActionable = (req: VacationRequestDto) =>
    req.status === 'PENDING_DEPT_MANAGER' || req.status === 'PENDING_MAIN_MANAGER';

  const renderCard = (req: VacationRequestDto) => {
    const meta = STATUS_META[req.status] ?? { bg: BORDER, text: MUTED, label: req.status };
    const actionable = isActionable(req);

    return (
      <View key={req.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.empName}>{req.employeeNameAr}</Text>
            {req.departmentNameAr && (
              <Text style={styles.deptName}>{req.departmentNameAr}</Text>
            )}
          </View>
          {/* Status chip: PENDING=gold, APPROVED=green, REJECTED=red */}
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateText}>📅 {req.startDate} → {req.endDate}</Text>
          <Text style={styles.daysText}>{req.totalDays} day{req.totalDays !== 1 ? 's' : ''}</Text>
        </View>

        {req.reason && <Text style={styles.reason}>"{req.reason}"</Text>}

        {/* Stage 1 review trail */}
        {req.deptReviewedAt && (
          <Text style={styles.reviewMeta}>
            🏢 Dept. Manager: {req.deptReviewerNameAr ?? '—'}
            {req.deptReviewNotes ? ` · "${req.deptReviewNotes}"` : ''}
          </Text>
        )}

        {actionable && (
          <>
            <TextInput
              style={styles.noteInput}
              value={notes[req.id] ?? ''}
              onChangeText={v => setNotes(prev => ({ ...prev, [req.id]: v }))}
              placeholder="Review notes (optional)"
              placeholderTextColor={MUTED}
              maxLength={300}
              multiline
            />
            <View style={styles.actionRow}>
              {/* Red reject button */}
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => confirmReject(req)}
                disabled={rejectMutation.isPending}
              >
                <Text style={styles.rejectBtnText}>✕ Reject</Text>
              </TouchableOpacity>
              {/* Green approve button */}
              <TouchableOpacity
                style={[styles.approveBtn,
                  req.status === 'PENDING_MAIN_MANAGER' && { backgroundColor: GREEN }]}
                onPress={() => confirmApprove(req)}
                disabled={approveMutation.isPending}
              >
                <Text style={styles.approveBtnText}>{approveLabel(req.status)}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {!actionable && req.reviewedAt && (
          <Text style={styles.reviewMeta}>
            ✅ Final: {req.reviewerNameAr ?? 'manager'} · {new Date(req.reviewedAt).toLocaleDateString()}
            {req.reviewNotes ? `\n"${req.reviewNotes}"` : ''}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Header — navyDark bg */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Vacation Requests</Text>
          <Text style={styles.titleAr}>طلبات الإجازة</Text>
        </View>
        {pending.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pending.length}</Text>
          </View>
        )}
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        {(['pending', 'all'] as TabKey[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'pending' ? `Pending (${pending.length})` : 'All Requests'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content — cream bg */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={doRefetch} tintColor={GREEN_MID} />}
      >
        {isLoading && <ActivityIndicator color={GREEN_MID} style={{ marginTop: 40 }} />}

        {!isLoading && displayList.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏖️</Text>
            <Text style={styles.emptyTitle}>
              {tab === 'pending' ? 'No Pending Requests' : 'No Requests Yet'}
            </Text>
          </View>
        )}

        {displayList.map(renderCard)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: CREAM },

  // Header — navyDark
  header:       { flexDirection: 'row', alignItems: 'center', gap: 12,
                  padding: 16, paddingBottom: 14, backgroundColor: GREEN_DARK },
  backBtn:      { padding: 4 },
  backText:     { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontFamily: 'Inter_500Medium' },
  title:        { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  titleAr:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  badge:        { backgroundColor: RED, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:    { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 13 },

  // Tabs
  tabs:         { flexDirection: 'row', backgroundColor: WHITE,
                  borderBottomWidth: 1, borderBottomColor: BORDER },
  tab:          { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: GREEN_MID },
  tabText:      { fontSize: 14, fontFamily: 'Inter_500Medium', color: MUTED },
  tabTextActive:{ color: GREEN_MID, fontFamily: 'Inter_600SemiBold' },

  scroll:       { padding: 16, paddingBottom: 60 },

  // White approval cards
  card:         { backgroundColor: WHITE, borderRadius: 18, padding: 16, marginBottom: 12,
                  borderWidth: 1, borderColor: BORDER,
                  shadowColor: GREEN_DARK, shadowOpacity: 0.10, shadowRadius: 16,
                  shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  empName:      { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: TEXT },
  deptName:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: MUTED, marginTop: 2 },

  // Status chips — PENDING=gold, APPROVED=green, REJECTED=red
  statusBadge:  { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  statusText:   { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  dateRow:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  dateText:     { fontSize: 14, fontFamily: 'Inter_400Regular', color: TEXT },
  daysText:     { fontSize: 14, fontFamily: 'Inter_500Medium', color: MUTED },
  reason:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: MUTED, fontStyle: 'italic', marginBottom: 10 },

  noteInput:    { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 12,
                  paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular', color: TEXT,
                  backgroundColor: WHITE, marginBottom: 12, minHeight: 44 },
  actionRow:    { flexDirection: 'row', gap: 10 },

  // Red reject button
  rejectBtn:    { flex: 1, borderWidth: 1.5, borderColor: RED, borderRadius: 14,
                  paddingVertical: 12, alignItems: 'center' },
  rejectBtnText:{ color: RED, fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  // Green approve button
  approveBtn:   { flex: 1, backgroundColor: GREEN_MID, borderRadius: 14,
                  paddingVertical: 12, alignItems: 'center' },
  approveBtnText:{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  reviewMeta:   { fontSize: 12, fontFamily: 'Inter_400Regular', color: MUTED, marginTop: 8, lineHeight: 18 },

  empty:        { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 56, marginBottom: 16 },
  emptyTitle:   { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: MUTED },
});
