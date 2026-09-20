/**
 * Admin — Schedule Assignment
 * Assign a weekly schedule to any active employee.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput, Modal, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, scheduleApi, EmployeeSummaryDto, ScheduleDto, ApiError } from '@/services/api';
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
const GREEN      = '#22C55E';
const RED        = light.destructive;

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABELS: Record<string, string> = {
  SUN: 'Sun', MON: 'Mon', TUE: 'Tue', WED: 'Wed', THU: 'Thu', FRI: 'Fri', SAT: 'Sat',
};

interface ScheduleForm {
  employeeId:   string;
  employeeName: string;
  weekStart:    string;
  workDays:     string[];
  shiftStart:   string;
  shiftEnd:     string;
  isWeekendDuty:boolean;
  notes:        string;
}

const emptyForm = (): ScheduleForm => ({
  employeeId: '', employeeName: '', weekStart: '',
  workDays: ['SUN', 'MON', 'TUE', 'WED', 'THU'],
  shiftStart: '07:00', shiftEnd: '15:00', isWeekendDuty: false, notes: '',
});

export default function SchedulesScreen() {
  const qc = useQueryClient();
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState<ScheduleForm>(emptyForm());
  const [formErr, setFormErr]     = useState('');
  const [empSearch, setEmpSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const { data: employees = [], isLoading: loadingEmp } = useQuery({
    queryKey: ['admin', 'employees'],
    queryFn: async () => {
      const r = await adminApi.listEmployees();
      return r.data ?? [];
    },
    staleTime: 120_000,
  });

  const { data: schedules = [], isLoading: loadingSch, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'schedules', 'recent'],
    queryFn: async () => {
      const r = await scheduleApi.getAdminRecent();
      return r.data ?? [];
    },
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => scheduleApi.create({
      employeeId:    form.employeeId,
      weekStart:     form.weekStart,
      workDays:      form.workDays.join(','),
      shiftStart:    form.shiftStart,
      shiftEnd:      form.shiftEnd,
      isWeekendDuty: form.isWeekendDuty,
      notes:         form.notes.trim() || undefined,
    }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['admin', 'schedules'] });
      setShowForm(false);
      setForm(emptyForm());
      setFormErr('');
    },
    onError: (err) => setFormErr(err instanceof ApiError ? err.message : 'Failed to create schedule'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => scheduleApi.deleteSchedule(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['admin', 'schedules'] });
    },
    onError: (err) => Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to delete'),
  });

  const toggleDay = (day: string) => {
    setForm(f => ({
      ...f,
      workDays: f.workDays.includes(day)
        ? f.workDays.filter(d => d !== day)
        : [...f.workDays, day],
    }));
  };

  const handleSubmit = () => {
    setFormErr('');
    if (!form.employeeId) { setFormErr('Select an employee'); return; }
    if (!form.weekStart)  { setFormErr('Enter week start date (YYYY-MM-DD, must be a Monday)'); return; }
    if (form.workDays.length === 0) { setFormErr('Select at least one work day'); return; }
    if (!form.shiftStart || !form.shiftEnd) { setFormErr('Shift start and end times are required'); return; }
    createMutation.mutate();
  };

  const filteredEmployees = employees.filter(e =>
    `${e.firstNameAr} ${e.lastNameAr}`.includes(empSearch) ||
    e.nationalId.includes(empSearch)
  );

  const confirmDelete = (s: ScheduleDto & { employeeName?: string }) => {
    Alert.alert('Delete Schedule', `Delete this schedule for week of ${s.weekStart}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(s.id) },
    ]);
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
          <Text style={styles.title}>Schedule Assignment</Text>
          <Text style={styles.titleAr}>تعيين الجداول</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setShowForm(v => !v); setFormErr(''); }}>
          <Text style={styles.addBtnText}>{showForm ? '✕ Close' : '+ Assign'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching && !loadingSch} onRefresh={refetch} tintColor={GREEN_MID} />}
      >
        {/* Assignment Form — white card */}
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New Schedule</Text>

            {!!formErr && (
              <View style={styles.errorBox}><Text style={styles.errorText}>{formErr}</Text></View>
            )}

            {/* Employee picker */}
            <Text style={styles.label}>Employee *</Text>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowPicker(true)}>
              <Text style={form.employeeName ? styles.pickerValue : styles.pickerPlaceholder}>
                {form.employeeName || 'Select employee…'}
              </Text>
            </TouchableOpacity>

            {/* Week start */}
            <Text style={styles.label}>Week Start (YYYY-MM-DD, Monday) *</Text>
            <TextInput
              style={styles.input}
              value={form.weekStart}
              onChangeText={v => setForm(f => ({ ...f, weekStart: v }))}
              placeholder="e.g. 2026-07-28"
              placeholderTextColor={MUTED}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            {/* Work days */}
            <Text style={styles.label}>Work Days *</Text>
            <View style={styles.daysRow}>
              {DAYS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayBtn, form.workDays.includes(d) && styles.dayBtnActive]}
                  onPress={() => toggleDay(d)}
                >
                  <Text style={[styles.dayBtnText, form.workDays.includes(d) && styles.dayBtnTextActive]}>
                    {DAY_LABELS[d]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Shift times */}
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Shift Start *</Text>
                <TextInput
                  style={styles.input}
                  value={form.shiftStart}
                  onChangeText={v => setForm(f => ({ ...f, shiftStart: v }))}
                  placeholder="07:00"
                  placeholderTextColor={MUTED}
                  maxLength={5}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Shift End *</Text>
                <TextInput
                  style={styles.input}
                  value={form.shiftEnd}
                  onChangeText={v => setForm(f => ({ ...f, shiftEnd: v }))}
                  placeholder="15:00"
                  placeholderTextColor={MUTED}
                  maxLength={5}
                />
              </View>
            </View>

            {/* Weekend duty toggle */}
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setForm(f => ({ ...f, isWeekendDuty: !f.isWeekendDuty }))}
            >
              <View style={[styles.toggle, form.isWeekendDuty && styles.toggleOn]}>
                <View style={[styles.toggleThumb, form.isWeekendDuty && styles.toggleThumbOn]} />
              </View>
              <Text style={styles.toggleLabel}>Weekend Duty</Text>
            </TouchableOpacity>

            {/* Notes */}
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
              value={form.notes}
              onChangeText={v => setForm(f => ({ ...f, notes: v }))}
              placeholder="Any additional notes"
              placeholderTextColor={MUTED}
              multiline
              maxLength={300}
            />

            <TouchableOpacity
              style={[styles.saveBtn, createMutation.isPending && { opacity: 0.5 }]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              <Text style={styles.saveBtnText}>
                {createMutation.isPending ? 'Saving…' : 'Assign Schedule'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent schedules */}
        <Text style={styles.sectionTitle}>Recent Assignments</Text>

        {loadingSch && <ActivityIndicator color={GREEN_MID} style={{ marginTop: 20 }} />}

        {!loadingSch && schedules.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>No Schedules Yet</Text>
          </View>
        )}

        {schedules.map(s => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardWeek}>Week of {s.weekStart}</Text>
                <Text style={styles.cardDays}>{s.workDays.replace(/,/g, ' · ')}</Text>
                <Text style={styles.cardShift}>🕐 {s.shiftStart.slice(0, 5)} – {s.shiftEnd.slice(0, 5)}</Text>
                {s.isWeekendDuty && <Text style={styles.weekendTag}>Weekend Duty</Text>}
                {s.notes && <Text style={styles.cardNotes}>{s.notes}</Text>}
              </View>
              <TouchableOpacity onPress={() => confirmDelete(s)} style={styles.deleteBtn}>
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Employee Picker Modal */}
      <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Employee</Text>
            <TextInput
              style={[styles.input, { marginBottom: 12 }]}
              value={empSearch}
              onChangeText={setEmpSearch}
              placeholder="Search by name or ID…"
              placeholderTextColor={MUTED}
            />
            <ScrollView style={{ maxHeight: 380 }}>
              {loadingEmp && <ActivityIndicator color={GREEN_MID} />}
              {filteredEmployees.map(e => (
                <TouchableOpacity
                  key={e.id}
                  style={styles.empRow}
                  onPress={() => {
                    setForm(f => ({ ...f, employeeId: e.id, employeeName: `${e.firstNameAr} ${e.lastNameAr}` }));
                    setShowPicker(false);
                    setEmpSearch('');
                  }}
                >
                  <Text style={styles.empName}>{e.firstNameAr} {e.lastNameAr}</Text>
                  <Text style={styles.empMeta}>{e.departmentNameAr ?? 'No Department'} · {e.nationalId}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[styles.saveBtn, { marginTop: 12 }]} onPress={() => setShowPicker(false)}>
              <Text style={styles.saveBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: CREAM },

  // Header — navyDark
  header:        { flexDirection: 'row', alignItems: 'center', gap: 12,
                   padding: 16, paddingBottom: 14, backgroundColor: GREEN_DARK },
  backBtn:       { padding: 4 },
  backText:      { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontFamily: 'Inter_500Medium' },
  title:         { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  titleAr:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  addBtn:        { backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:    { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  scroll:        { padding: 16, paddingBottom: 60 },

  // White form card
  formCard:      { backgroundColor: WHITE, borderRadius: 18, padding: 20, marginBottom: 20,
                   borderWidth: 1, borderColor: BORDER,
                   shadowColor: GREEN_DARK, shadowOpacity: 0.10, shadowRadius: 16,
                   shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  formTitle:     { fontSize: 18, fontFamily: 'Inter_700Bold', color: TEXT, marginBottom: 16 },
  label:         { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEXT, marginBottom: 6 },
  input:         { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14,
                   height: 54, fontSize: 14, fontFamily: 'Inter_400Regular', color: TEXT,
                   backgroundColor: WHITE, marginBottom: 14 },
  pickerBtn:     { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14,
                   height: 54, justifyContent: 'center', backgroundColor: WHITE, marginBottom: 14 },
  pickerValue:   { fontSize: 14, fontFamily: 'Inter_400Regular', color: TEXT },
  pickerPlaceholder: { fontSize: 14, fontFamily: 'Inter_400Regular', color: MUTED },
  daysRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  dayBtn:        { borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, paddingHorizontal: 12,
                   paddingVertical: 8, backgroundColor: WHITE },
  dayBtnActive:  { backgroundColor: GREEN_MID, borderColor: GREEN_MID },
  dayBtnText:    { fontSize: 13, fontFamily: 'Inter_500Medium', color: MUTED },
  dayBtnTextActive: { color: '#fff' },
  timeRow:       { flexDirection: 'row', gap: 12 },
  toggleRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  toggle:        { width: 44, height: 24, borderRadius: 12, backgroundColor: BORDER,
                   justifyContent: 'center', paddingHorizontal: 2 },
  toggleOn:      { backgroundColor: GREEN },
  toggleThumb:   { width: 20, height: 20, borderRadius: 10, backgroundColor: WHITE, alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  toggleLabel:   { fontSize: 14, fontFamily: 'Inter_400Regular', color: TEXT },
  saveBtn:       { backgroundColor: GREEN_MID, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  saveBtnText:   { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  errorBox:      { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 12,
                   borderWidth: 1, borderColor: '#FECACA' },
  errorText:     { color: RED, fontSize: 13, fontFamily: 'Inter_400Regular' },

  sectionTitle:  { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: MUTED,
                   letterSpacing: 0.6, marginBottom: 10, marginTop: 4, textTransform: 'uppercase' },

  // White assignment cards
  card:          { backgroundColor: WHITE, borderRadius: 16, padding: 16, marginBottom: 12,
                   borderWidth: 1, borderColor: BORDER,
                   shadowColor: GREEN_DARK, shadowOpacity: 0.10, shadowRadius: 16,
                   shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cardTop:       { flexDirection: 'row', alignItems: 'flex-start' },
  cardWeek:      { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: TEXT, marginBottom: 4 },
  cardDays:      { fontSize: 13, fontFamily: 'Inter_400Regular', color: MUTED, marginBottom: 4 },
  cardShift:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: TEXT },
  weekendTag:    { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: '#B45309',
                   backgroundColor: '#FEF3C7', borderRadius: 10,
                   paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 4 },
  cardNotes:     { fontSize: 13, fontFamily: 'Inter_400Regular', color: MUTED, fontStyle: 'italic', marginTop: 4 },
  deleteBtn:     { padding: 8 },
  deleteBtnText: { color: RED, fontSize: 18, fontFamily: 'Inter_700Bold' },

  empty:         { alignItems: 'center', paddingTop: 40 },
  emptyIcon:     { fontSize: 48, marginBottom: 12 },
  emptyTitle:    { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: MUTED },

  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                   padding: 24, maxHeight: '80%', borderWidth: 1, borderColor: BORDER },
  modalTitle:    { fontSize: 20, fontFamily: 'Inter_700Bold', color: TEXT, marginBottom: 16 },
  empRow:        { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  empName:       { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: TEXT },
  empMeta:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: MUTED, marginTop: 2 },
});
