/**
 * Vacations screen — Midnight Glass design, fully Arabic, RTL
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator, RefreshControl, StatusBar,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vacationApi, VacationRequestDto, ApiError } from '@/services/api';

// ── Midnight Glass palette ────────────────────────────────────────────────────
const BG      = '#0A0F0D';
const SURFACE = 'rgba(255,255,255,0.07)';
const SURFACE2= 'rgba(255,255,255,0.04)';
const BORDER  = 'rgba(255,255,255,0.12)';
const NEON    = '#00E676';
const NEON2   = '#00BFA5';
const GOLD    = '#C9963F';
const WHITE   = '#FFFFFF';
const MUTED   = 'rgba(255,255,255,0.55)';
const AMBER   = '#F59E0B';
const RED     = '#EF4444';

const STATUS_META: Record<string, { bg: string; border: string; text: string; label: string }> = {
  PENDING_DEPT_MANAGER:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',  text: AMBER, label: 'بانتظار مدير القسم' },
  PENDING_MAIN_MANAGER:  { bg: 'rgba(0,230,118,0.10)',  border: 'rgba(0,230,118,0.25)',  text: NEON,  label: 'بانتظار المدير العام' },
  APPROVED:              { bg: 'rgba(0,230,118,0.12)',  border: 'rgba(0,230,118,0.30)',  text: NEON,  label: 'موافق عليها' },
  REJECTED:              { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.30)',  text: RED,   label: 'مرفوضة' },
  CANCELLED:             { bg: SURFACE, border: BORDER, text: MUTED, label: 'ملغاة' },
};

function RequestCard({ req, onCancel }: { req: VacationRequestDto; onCancel: (id: string) => void }) {
  const meta      = STATUS_META[req.status] ?? STATUS_META.PENDING_DEPT_MANAGER;
  const canCancel = req.status === 'PENDING_DEPT_MANAGER';

  return (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
          <Text style={[styles.statusText, { color: meta.text }]}>{meta.label}</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.requestDates}>{req.startDate} ← {req.endDate}</Text>
          <Text style={styles.requestDays}>{req.totalDays} يوم</Text>
        </View>
      </View>

      {req.reason ? <Text style={styles.requestReason}>{req.reason}</Text> : null}

      {req.deptReviewNotes ? (
        <Text style={styles.reviewNotes}>
          🏢 {req.deptReviewNotes}{req.deptReviewerNameAr ? ` — ${req.deptReviewerNameAr}` : ''}
        </Text>
      ) : null}

      {req.reviewNotes ? (
        <Text style={styles.reviewNotes}>
          💬 {req.reviewNotes}{req.reviewerNameAr ? ` — ${req.reviewerNameAr}` : ''}
        </Text>
      ) : null}

      {canCancel && (
        <TouchableOpacity style={styles.cancelBtn} onPress={() => onCancel(req.id)}>
          <Text style={styles.cancelBtnText}>إلغاء الطلب</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Form modal ────────────────────────────────────────────────────────────────

function RequestForm({
  visible, onClose, onSubmit, isPending,
}: {
  visible: boolean; onClose: () => void;
  onSubmit: (startDate: string, endDate: string, reason: string) => void;
  isPending: boolean;
}) {
  const insets = useSafeAreaInsets();
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [reason,    setReason]    = useState('');
  const [formError, setFormError] = useState('');

  function handleSubmit() {
    setFormError('');
    if (!startDate || !endDate) { setFormError('يرجى إدخال تاريخ البداية والنهاية.'); return; }
    onSubmit(startDate, endDate, reason);
    setStartDate(''); setEndDate(''); setReason('');
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0D1510' }} edges={['top', 'bottom']}>
          {/* Modal header — neon gradient */}
          <LinearGradient colors={[NEON, NEON2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#0A0F0D" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>طلب إجازة جديدة</Text>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {!!formError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            )}

            <Text style={styles.fieldLabel}>تاريخ البداية (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="مثال: 2026-08-01"
              placeholderTextColor={MUTED}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              textAlign="right"
            />

            <Text style={styles.fieldLabel}>تاريخ النهاية (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="مثال: 2026-08-07"
              placeholderTextColor={MUTED}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              textAlign="right"
            />

            <Text style={styles.fieldLabel}>السبب (اختياري)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reason}
              onChangeText={setReason}
              placeholder="تفسير مختصر"
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={3}
              maxLength={500}
              textAlign="right"
              textAlignVertical="top"
            />

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isPending}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isPending ? ['rgba(0,230,118,0.4)', 'rgba(0,191,165,0.4)'] : [NEON, NEON2]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {isPending
                  ? <ActivityIndicator color="#0A0F0D" />
                  : <Text style={styles.submitBtnText}>إرسال الطلب</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function VacationsScreen() {
  const qc      = useQueryClient();
  const insets  = useSafeAreaInsets();
  const [showForm, setShowForm] = useState(false);

  const { data: balanceRes } = useQuery({
    queryKey: ['vacation-balance'],
    queryFn:  () => vacationApi.getBalance(),
    staleTime: 60_000,
  });
  const balance = balanceRes?.data;

  const { data: requests = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['vacation-requests'],
    queryFn:  async () => { const r = await vacationApi.list(); return r.data ?? []; },
    staleTime: 30_000,
  });

  const submitMutation = useMutation({
    mutationFn: ({ startDate, endDate, reason }: { startDate: string; endDate: string; reason: string }) =>
      vacationApi.submit({ startDate, endDate, reason }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['vacation-requests'] });
      qc.invalidateQueries({ queryKey: ['vacation-balance'] });
      setShowForm(false);
      Alert.alert('تم الإرسال', 'تم إرسال طلب إجازتك إلى مدير القسم للمراجعة.');
    },
    onError: (e: ApiError) => Alert.alert('خطأ', e.message ?? 'فشل الإرسال'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => vacationApi.cancel(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['vacation-requests'] });
      qc.invalidateQueries({ queryKey: ['vacation-balance'] });
    },
    onError: (e: ApiError) => Alert.alert('خطأ', e.message ?? 'فشل الإلغاء'),
  });

  function confirmCancel(id: string) {
    Alert.alert('إلغاء الطلب', 'هل أنت متأكد أنك تريد إلغاء هذا الطلب؟', [
      { text: 'لا', style: 'cancel' },
      { text: 'نعم، إلغاء', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
    ]);
  }

  const pending  = (requests as VacationRequestDto[]).filter(r =>
    r.status === 'PENDING_DEPT_MANAGER' || r.status === 'PENDING_MAIN_MANAGER');
  const approved = (requests as VacationRequestDto[]).filter(r => r.status === 'APPROVED');
  const past     = (requests as VacationRequestDto[]).filter(r =>
    r.status === 'REJECTED' || r.status === 'CANCELLED');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={[styles.screenHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerGlow} />
        <View>
          <Text style={styles.screenTitle}>الإجازات</Text>
          <Text style={styles.screenSubtitle}>طلباتي ورصيدي</Text>
        </View>
        <Ionicons name="sunny-outline" size={28} color={GOLD} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 110 }]}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={NEON} />
        }
      >
        {/* Balance card */}
        {balance && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceTitle}>رصيد الإجازة {balance.year}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceStat}>
                <Text style={[styles.balanceNum, { color: MUTED }]}>{balance.daysAllowed}</Text>
                <Text style={styles.balanceLabel}>المقرر</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceStat}>
                <Text style={[styles.balanceNum, { color: AMBER }]}>{balance.daysUsed}</Text>
                <Text style={styles.balanceLabel}>المستخدم</Text>
              </View>
              <View style={styles.balanceDivider} />
              <View style={styles.balanceStat}>
                <Text style={[styles.balanceNum, { color: NEON }]}>{balance.daysRemaining}</Text>
                <Text style={styles.balanceLabel}>المتبقي</Text>
              </View>
            </View>
          </View>
        )}

        {isLoading && <ActivityIndicator color={NEON} style={{ marginTop: 40 }} />}

        {pending.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>قيد الانتظار ({pending.length})</Text>
            {pending.map(r => <RequestCard key={r.id} req={r} onCancel={confirmCancel} />)}
          </>
        )}

        {approved.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>موافق عليها</Text>
            {approved.map(r => <RequestCard key={r.id} req={r} onCancel={confirmCancel} />)}
          </>
        )}

        {past.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>الطلبات السابقة</Text>
            {past.map(r => <RequestCard key={r.id} req={r} onCancel={confirmCancel} />)}
          </>
        )}

        {!isLoading && (requests as VacationRequestDto[]).length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🏖️</Text>
            <Text style={styles.emptyTitle}>لا توجد طلبات إجازة</Text>
            <Text style={styles.emptyBody}>اضغط على الزر + لتقديم طلب إجازة جديد</Text>
          </View>
        )}
      </ScrollView>

      {/* FAB — neon glow */}
      <TouchableOpacity
        style={[styles.fab, { bottom: insets.bottom + 90 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowForm(true); }}
        activeOpacity={0.85}
      >
        <LinearGradient colors={[NEON, NEON2]} style={styles.fabGradient}>
          <Ionicons name="add" size={28} color="#0A0F0D" />
        </LinearGradient>
      </TouchableOpacity>

      <RequestForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={(startDate, endDate, reason) => submitMutation.mutate({ startDate, endDate, reason })}
        isPending={submitMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: BG },
  scroll:{ padding: 20 },

  // Header
  screenHeader:   { paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden', position: 'relative',
                    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end',
                    backgroundColor: BG },
  headerGlow:     { position: 'absolute', top: -30, right: -20, width: 140, height: 140, borderRadius: 70,
                    backgroundColor: 'rgba(0,230,118,0.06)' },
  screenTitle:    { fontSize: 26, fontFamily: 'Inter_700Bold', color: WHITE, textAlign: 'right' },
  screenSubtitle: { fontSize: 13, color: MUTED, marginTop: 2, textAlign: 'right' },

  // Balance card
  balanceCard:    { backgroundColor: SURFACE, borderRadius: 20, padding: 18, marginBottom: 20,
                    borderWidth: 1, borderColor: BORDER },
  balanceTitle:   { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: MUTED,
                    marginBottom: 14, textAlign: 'center' },
  balanceRow:     { flexDirection: 'row', alignItems: 'center' },
  balanceStat:    { flex: 1, alignItems: 'center' },
  balanceNum:     { fontSize: 30, fontFamily: 'Inter_700Bold' },
  balanceLabel:   { fontSize: 12, color: MUTED, marginTop: 4 },
  balanceDivider: { width: 1, height: 40, backgroundColor: BORDER },

  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: MUTED,
                  letterSpacing: 0.5, marginBottom: 10, marginTop: 6,
                  textAlign: 'right', textTransform: 'uppercase' },

  // Request cards
  requestCard:   { backgroundColor: SURFACE, borderRadius: 18, padding: 16, marginBottom: 12,
                   borderWidth: 1, borderColor: BORDER },
  requestHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between',
                   alignItems: 'flex-start', marginBottom: 8 },
  requestDates:  { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: WHITE, textAlign: 'right' },
  requestDays:   { fontSize: 12, color: MUTED, marginTop: 2, textAlign: 'right' },
  statusBadge:   { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, maxWidth: 160, borderWidth: 1 },
  statusText:    { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  requestReason: { fontSize: 14, color: MUTED, lineHeight: 20, marginBottom: 8, textAlign: 'right' },
  reviewNotes:   { fontSize: 13, color: MUTED, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8,
                   padding: 10, marginBottom: 8, borderWidth: 1, borderColor: BORDER, textAlign: 'right' },
  cancelBtn:     { borderWidth: 1.5, borderColor: RED, borderRadius: 10, padding: 10,
                   alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: RED, fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  emptyCard:  { backgroundColor: SURFACE, borderRadius: 20, padding: 36,
                alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: BORDER },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: WHITE, marginBottom: 10 },
  emptyBody:  { fontSize: 15, color: MUTED, textAlign: 'center', lineHeight: 22 },

  // FAB
  fab:         { position: 'absolute', right: 24, width: 60, height: 60, borderRadius: 30,
                 shadowColor: NEON, shadowOffset: { width: 0, height: 6 },
                 shadowOpacity: 0.5, shadowRadius: 14, elevation: 10 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },

  // Modal
  modalHeader: { paddingHorizontal: 20, paddingVertical: 18,
                 flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  modalTitle:  { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: '#0A0F0D', textAlign: 'right' },
  closeBtn:    { padding: 4 },
  modalScroll: { padding: 20, paddingBottom: 40 },

  errorBox:   { backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: 10, padding: 12, marginBottom: 16,
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  errorText:  { color: RED, fontSize: 14, textAlign: 'right' },
  fieldLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.75)',
                marginBottom: 6, textAlign: 'right' },
  input:      { borderWidth: 1.5, borderColor: BORDER, borderRadius: 14, padding: 14,
                fontSize: 15, color: WHITE, backgroundColor: SURFACE,
                marginBottom: 16, minHeight: 52 },
  textArea:   { minHeight: 90, textAlignVertical: 'top' },
  submitBtn:  { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#0A0F0D', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
