/**
 * Shift Swap screen — employee can view and create shift swap requests.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi, adminApi, SwapRequestDto, EmployeeSummaryDto, ApiError } from '@/services/api';
import colors from '@/constants/colors';

const { government } = colors;
const NAVY  = government.navy;
const GOLD  = government.gold;
const BG    = '#F8F9FA';
const CARD  = '#FFFFFF';
const GRAY  = '#6B7280';

const STATUS_META: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:  { bg: '#FEF3C7', text: '#92400E', label: 'Pending' },
  APPROVED: { bg: '#D1FAE5', text: '#065F46', label: 'Approved' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
};

export default function ShiftSwapScreen() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [myWeek,    setMyWeek]    = useState('');
  const [theirWeek, setTheirWeek] = useState('');
  const [reason,    setReason]    = useState('');
  const [targetId,  setTargetId]  = useState('');
  const [search,    setSearch]    = useState('');

  const { data: myReqs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['swaps', 'my'],
    queryFn:  () => scheduleApi.getMySwaps(),
    staleTime: 30_000,
  });

  const { data: empData } = useQuery({
    queryKey: ['admin', 'employees', 'active'],
    queryFn:  () => adminApi.listActiveEmployees(),
    staleTime: 5 * 60_000,
  });

  const swaps: SwapRequestDto[] = myReqs?.data ?? [];
  const employees: EmployeeSummaryDto[] = empData?.data ?? [];
  const filteredEmps = search.trim()
    ? employees.filter(e => `${e.firstNameAr} ${e.lastNameAr}`.includes(search.trim()))
    : employees;

  const submitMutation = useMutation({
    mutationFn: () => scheduleApi.createSwapRequest({
      targetEmployeeId: targetId,
      myWeekStart: myWeek.trim(),
      theirWeekStart: theirWeek.trim(),
      reason: reason.trim() || undefined,
    }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['swaps'] });
      setShowForm(false);
      setMyWeek(''); setTheirWeek(''); setReason(''); setTargetId(''); setSearch('');
      Alert.alert('Requested', 'Your shift swap request has been submitted for approval.');
    },
    onError: (err) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Submission failed.');
    },
  });

  const handleSubmit = () => {
    if (!targetId) { Alert.alert('Select Employee', 'Please select the employee you want to swap with.'); return; }
    if (!myWeek || !theirWeek) { Alert.alert('Missing Dates', 'Enter both week start dates (YYYY-MM-DD).'); return; }
    submitMutation.mutate();
  };

  const pending  = swaps.filter(s => s.status === 'PENDING');
  const resolved = swaps.filter(s => s.status !== 'PENDING');

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={NAVY} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Shift Swaps</Text>
            <Text style={styles.titleAr}>تبديل المناوبات</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => setShowForm(v => !v)}>
            <Text style={styles.newBtnText}>{showForm ? '✕ Close' : '+ New Request'}</Text>
          </TouchableOpacity>
        </View>

        {/* Request form */}
        {showForm && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>New Swap Request</Text>

            <Text style={styles.label}>Find Employee to Swap With</Text>
            <TextInput style={styles.input} value={search} onChangeText={setSearch}
              placeholder="Search by name…" />
            {search.trim().length > 0 && filteredEmps.slice(0, 5).map(e => (
              <TouchableOpacity
                key={e.id}
                style={[styles.empOption, targetId === e.id && styles.empOptionSelected]}
                onPress={() => { setTargetId(e.id); setSearch(`${e.firstNameAr} ${e.lastNameAr}`); }}
              >
                <Text style={styles.empOptionText}>{e.firstNameAr} {e.lastNameAr}</Text>
                <Text style={styles.empOptionRole}>{e.departmentNameAr}</Text>
              </TouchableOpacity>
            ))}
            {targetId ? (
              <Text style={styles.selectedNote}>✓ Selected: {employees.find(e=>e.id===targetId)?.firstNameAr}</Text>
            ) : null}

            <Text style={styles.label}>My Week Start (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={myWeek} onChangeText={setMyWeek}
              placeholder="e.g. 2026-08-03" keyboardType="numbers-and-punctuation" maxLength={10} />

            <Text style={styles.label}>Their Week Start (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={theirWeek} onChangeText={setTheirWeek}
              placeholder="e.g. 2026-08-10" keyboardType="numbers-and-punctuation" maxLength={10} />

            <Text style={styles.label}>Reason (optional)</Text>
            <TextInput style={[styles.input, styles.textArea]} value={reason} onChangeText={setReason}
              placeholder="Brief explanation" multiline numberOfLines={3} maxLength={300} />

            <TouchableOpacity
              style={[styles.submitBtn, submitMutation.isPending && styles.disabledBtn]}
              onPress={handleSubmit} disabled={submitMutation.isPending}
            >
              <Text style={styles.submitBtnText}>
                {submitMutation.isPending ? 'Submitting…' : 'Submit Request'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && <ActivityIndicator color={NAVY} style={{ marginTop: 40 }} />}

        {pending.length > 0 && (
          <>
            <Text style={styles.section}>Pending ({pending.length})</Text>
            {pending.map(s => <SwapCard key={String(s.id)} swap={s} />)}
          </>
        )}

        {resolved.length > 0 && (
          <>
            <Text style={styles.section}>Past Requests</Text>
            {resolved.map(s => <SwapCard key={String(s.id)} swap={s} />)}
          </>
        )}

        {!isLoading && swaps.length === 0 && !showForm && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔄</Text>
            <Text style={styles.emptyTitle}>No Swap Requests</Text>
            <Text style={styles.emptyBody}>Tap "New Request" to request a shift swap with a colleague.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SwapCard({ swap }: { swap: SwapRequestDto }) {
  const meta = STATUS_META[swap.status] ?? STATUS_META.PENDING;
  return (
    <View style={styles.swapCard}>
      <View style={styles.swapHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.swapTitle}>
            {swap.requesterName} ⇄ {swap.targetName}
          </Text>
          <Text style={styles.swapWeeks}>
            Week {swap.requesterWeekStart} ↔ Week {swap.targetWeekStart}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.text }]}>{meta.label}</Text>
        </View>
      </View>
      {swap.reason ? <Text style={styles.swapReason}>{swap.reason}</Text> : null}
      {swap.reviewNotes ? (
        <Text style={styles.reviewNote}>💬 {swap.reviewNotes}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },
  scroll:           { padding: 20, paddingBottom: 80 },
  header:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  title:            { fontSize: 26, fontWeight: '700', color: NAVY },
  titleAr:          { fontSize: 16, color: GRAY, marginTop: 2 },
  newBtn:           { backgroundColor: NAVY, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 4 },
  newBtnText:       { color: '#fff', fontWeight: '600', fontSize: 14 },
  card:             { backgroundColor: CARD, borderRadius: 16, padding: 20, marginBottom: 20, elevation: 2,
                      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
  cardTitle:        { fontSize: 18, fontWeight: '700', color: NAVY, marginBottom: 14 },
  label:            { fontSize: 13, fontWeight: '600', color: NAVY, marginBottom: 6, marginTop: 8 },
  input:            { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12,
                      fontSize: 15, color: NAVY, backgroundColor: BG, marginBottom: 4 },
  textArea:         { minHeight: 80, textAlignVertical: 'top' },
  empOption:        { padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8, marginBottom: 4 },
  empOptionSelected:{ backgroundColor: NAVY + '15' },
  empOptionText:    { fontSize: 14, fontWeight: '600', color: NAVY },
  empOptionRole:    { fontSize: 12, color: GRAY },
  selectedNote:     { fontSize: 12, color: '#16a34a', fontWeight: '600', marginBottom: 8 },
  submitBtn:        { backgroundColor: NAVY, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 },
  disabledBtn:      { opacity: 0.6 },
  submitBtnText:    { color: '#fff', fontWeight: '700', fontSize: 15 },
  section:          { fontSize: 14, fontWeight: '700', color: GRAY, marginBottom: 10, marginTop: 4, textTransform: 'uppercase' },
  swapCard:         { backgroundColor: CARD, borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1,
                      shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  swapHeader:       { flexDirection: 'row', alignItems: 'flex-start' },
  swapTitle:        { fontSize: 14, fontWeight: '700', color: NAVY },
  swapWeeks:        { fontSize: 12, color: GRAY, marginTop: 2 },
  badge:            { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  badgeText:        { fontSize: 11, fontWeight: '600' },
  swapReason:       { fontSize: 13, color: GRAY, marginTop: 8 },
  reviewNote:       { fontSize: 12, color: '#374151', marginTop: 6, fontStyle: 'italic' },
  empty:            { alignItems: 'center', marginTop: 60 },
  emptyIcon:        { fontSize: 48, marginBottom: 12 },
  emptyTitle:       { fontSize: 18, fontWeight: '700', color: NAVY, marginBottom: 6 },
  emptyBody:        { fontSize: 14, color: GRAY, textAlign: 'center', maxWidth: 280 },
});
