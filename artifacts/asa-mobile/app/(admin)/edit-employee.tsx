/**
 * Edit Employee — Midnight Glass design + multi-role support
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, ApiError } from '@/services/api';
import * as Haptics from 'expo-haptics';

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

// ── Role definitions ──────────────────────────────────────────────────────────
const ALL_ROLES = [
  { value: 'SYSTEM_ADMIN',       labelAr: 'مشرف النظام',     labelEn: 'System Admin',       color: RED,    icon: 'shield' as const },
  { value: 'MAIN_MANAGER',       labelAr: 'المدير العام',    labelEn: 'Main Manager',        color: GOLD,   icon: 'star' as const },
  { value: 'DEPARTMENT_MANAGER', labelAr: 'مدير القسم',      labelEn: 'Department Manager',  color: '#60A5FA', icon: 'business' as const },
  { value: 'WEEKEND_MANAGER',    labelAr: 'مدير نهاية الأسبوع', labelEn: 'Weekend Manager', color: '#A78BFA', icon: 'calendar' as const },
  { value: 'RESPONSIBLE_OFFICER',labelAr: 'ضابط مسؤول',      labelEn: 'Responsible Officer', color: '#FB923C', icon: 'ribbon' as const },
  { value: 'EMPLOYEE',           labelAr: 'موظف',            labelEn: 'Employee',            color: NEON,   icon: 'person' as const },
];

const STATUSES = [
  { value: 'ACTIVE',    labelAr: 'نشط',    color: NEON },
  { value: 'SUSPENDED', labelAr: 'موقوف',  color: RED  },
];

export default function EditEmployeeScreen() {
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const params = useLocalSearchParams<{
    id: string; nationalId: string; firstNameAr: string; middleNameAr: string;
    lastNameAr: string; phone: string; roles: string; status: string; vacationDays: string;
  }>();

  const maskedNationalId = params.nationalId
    ? '•'.repeat(Math.max(0, params.nationalId.length - 4)) + params.nationalId.slice(-4)
    : null;

  // Parse roles from navigation param (JSON array string)
  const initialRoles: string[] = (() => {
    try { return params.roles ? JSON.parse(params.roles) : ['EMPLOYEE']; }
    catch { return ['EMPLOYEE']; }
  })();

  const [firstName,    setFirstName]    = useState(params.firstNameAr ?? '');
  const [middleName,   setMiddleName]   = useState(params.middleNameAr ?? '');
  const [lastName,     setLastName]     = useState(params.lastNameAr ?? '');
  const [vacationDays, setVacationDays] = useState(params.vacationDays ?? '21');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles);
  const [status,       setStatus]       = useState(params.status ?? 'ACTIVE');

  const toggleRole = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (selectedRoles.length === 0) {
        throw new Error('يجب تحديد صلاحية واحدة على الأقل');
      }
      return adminApi.updateEmployee(params.id, {
        firstNameAr:        firstName.trim()  || undefined,
        middleNameAr:       middleName.trim() !== '' ? middleName.trim() : '',
        lastNameAr:         lastName.trim()   || undefined,
        roles:              selectedRoles,
        status,
        vacationDaysPerYear: parseInt(vacationDays, 10) || 21,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'employees'] });
      Alert.alert('تم الحفظ', 'تم تحديث بيانات الموظف بنجاح.');
      router.back();
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message
        : err instanceof Error ? err.message
        : 'فشل التحديث. يرجى المحاولة مجدداً.';
      Alert.alert('خطأ', msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteEmployee(params.id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin', 'employees'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('تم الحذف', res.data?.message ?? 'تم حذف الموظف بنجاح.');
      router.back();
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message
        : err instanceof Error ? err.message
        : 'فشل الحذف. يرجى المحاولة مجدداً.';
      Alert.alert('خطأ', msg);
    },
  });

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'حذف الموظف',
      `هل أنت متأكد من حذف حساب ${params.firstNameAr} ${params.lastNameAr}؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف نهائي', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]
    );
  };

  const isSuspended = status === 'SUSPENDED';

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Glow blobs */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>تعديل بيانات الموظف</Text>
          <Text style={styles.titleSub}>
            {params.firstNameAr} {params.lastNameAr}
            {maskedNationalId ? `  ·  ${maskedNationalId}` : ''}
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Suspended banner */}
        {isSuspended && (
          <View style={styles.suspendedBanner}>
            <Ionicons name="ban-outline" size={16} color={RED} />
            <Text style={styles.suspendedText}>  هذا الحساب موقوف حالياً</Text>
          </View>
        )}

        {/* ── Name + Vacation card ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>البيانات الشخصية</Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>الاسم الأول</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName}
                placeholder="الاسم الأول" placeholderTextColor={MUTED}
                textAlign="right" selectionColor={NEON} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>اسم العائلة</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName}
                placeholder="اسم العائلة" placeholderTextColor={MUTED}
                textAlign="right" selectionColor={NEON} />
            </View>
          </View>

          <Text style={styles.label}>الاسم الأوسط (اختياري)</Text>
          <TextInput style={styles.input} value={middleName} onChangeText={setMiddleName}
            placeholder="مثال: عبدالله" placeholderTextColor={MUTED}
            textAlign="right" selectionColor={NEON} />

          <Text style={styles.label}>أيام الإجازة السنوية</Text>
          <TextInput style={styles.input} value={vacationDays} onChangeText={setVacationDays}
            keyboardType="number-pad" placeholder="21" placeholderTextColor={MUTED}
            maxLength={3} textAlign="right" selectionColor={NEON} />
        </View>

        {/* ── Multi-role picker ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionLabel}>الصلاحيات</Text>
            <View style={[styles.countPill, { backgroundColor: NEON + '20', borderColor: NEON + '40' }]}>
              <Text style={[styles.countText, { color: NEON }]}>{selectedRoles.length} محدد</Text>
            </View>
          </View>
          <Text style={styles.cardHint}>يمكن تحديد أكثر من صلاحية</Text>

          {ALL_ROLES.map(role => {
            const checked = selectedRoles.includes(role.value);
            return (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleRow,
                  checked && { backgroundColor: role.color + '12', borderColor: role.color + '40' },
                ]}
                onPress={() => toggleRole(role.value)}
                activeOpacity={0.75}
              >
                {/* Icon */}
                <View style={[styles.roleIcon, { backgroundColor: role.color + '18' }]}>
                  <Ionicons name={`${role.icon}-outline` as any} size={18} color={role.color} />
                </View>

                {/* Labels */}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleLabelAr, checked && { color: WHITE }]}>{role.labelAr}</Text>
                  <Text style={styles.roleLabelEn}>{role.labelEn}</Text>
                </View>

                {/* Checkbox */}
                <View style={[
                  styles.checkbox,
                  checked
                    ? { backgroundColor: role.color, borderColor: role.color }
                    : { backgroundColor: 'transparent', borderColor: BORDER },
                ]}>
                  {checked && <Ionicons name="checkmark" size={14} color="#0A0F0D" />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Account Status ── */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>حالة الحساب</Text>
          <View style={styles.statusRow}>
            {STATUSES.map(s => {
              const active = status === s.value;
              return (
                <TouchableOpacity
                  key={s.value}
                  style={[
                    styles.statusChip,
                    active
                      ? { backgroundColor: s.color + '20', borderColor: s.color }
                      : { backgroundColor: SURFACE, borderColor: BORDER },
                  ]}
                  onPress={() => setStatus(s.value)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.statusDot, { backgroundColor: active ? s.color : MUTED }]} />
                  <Text style={[styles.statusLabel, { color: active ? s.color : MUTED }]}>
                    {s.labelAr}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Save button ── */}
        <TouchableOpacity
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending || deleteMutation.isPending || selectedRoles.length === 0}
          activeOpacity={0.88}
          style={[styles.saveBtnWrap, (mutation.isPending || selectedRoles.length === 0) && { opacity: 0.5 }]}
        >
          <LinearGradient
            colors={[NEON, NEON2]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.saveBtn}
          >
            {mutation.isPending
              ? <ActivityIndicator color="#0A0F0D" />
              : <Text style={styles.saveBtnText}>حفظ التغييرات</Text>}
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Delete button ── */}
        <TouchableOpacity
          onPress={handleDelete}
          disabled={mutation.isPending || deleteMutation.isPending}
          activeOpacity={0.82}
          style={[styles.deleteBtn, (mutation.isPending || deleteMutation.isPending) && { opacity: 0.5 }]}
        >
          {deleteMutation.isPending
            ? <ActivityIndicator color={RED} size="small" />
            : <>
                <Ionicons name="trash-outline" size={18} color={RED} />
                <Text style={styles.deleteBtnText}>حذف الحساب نهائياً</Text>
              </>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  glow1: { position: 'absolute', top: -40, right: -40, width: 180, height: 180,
           borderRadius: 90, backgroundColor: 'rgba(0,230,118,0.06)', pointerEvents: 'none' },
  glow2: { position: 'absolute', top: 200, left: -60, width: 140, height: 140,
           borderRadius: 70, backgroundColor: 'rgba(201,150,63,0.04)', pointerEvents: 'none' },

  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: 'rgba(10,15,13,0.98)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  backBtn:  { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)' },
  title:    { fontSize: 17, fontFamily: 'Inter_700Bold', color: WHITE, textAlign: 'right' },
  titleSub: { fontSize: 12, color: MUTED, textAlign: 'right', marginTop: 2 },

  content: { paddingHorizontal: 16, paddingTop: 16, gap: 14 },

  suspendedBanner: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  suspendedText: { color: RED, fontSize: 13, fontFamily: 'Inter_600SemiBold', textAlign: 'right' },

  card: {
    backgroundColor: SURFACE, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: BORDER, gap: 10,
  },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  cardHint:   { fontSize: 11, color: MUTED, textAlign: 'right', marginTop: -4 },
  countPill:  { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  countText:  { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  sectionLabel: {
    fontSize: 12, fontFamily: 'Inter_700Bold', color: MUTED,
    textAlign: 'right', letterSpacing: 0.8, textTransform: 'uppercase',
  },

  row:   { flexDirection: 'row-reverse', gap: 8 },
  label: { fontSize: 12, color: MUTED, textAlign: 'right', marginBottom: 6 },

  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, paddingHorizontal: 14, height: 52,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: WHITE,
  },

  // Role rows
  roleRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1, borderColor: 'transparent',
    marginBottom: 2,
  },
  roleIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  roleLabelAr: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: MUTED, textAlign: 'right' },
  roleLabelEn: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'right', marginTop: 2 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // Status
  statusRow: { flexDirection: 'row-reverse', gap: 10 },
  statusChip: {
    flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, borderWidth: 1.5, paddingVertical: 14,
  },
  statusDot:   { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  // Save button
  saveBtnWrap: {
    shadowColor: NEON, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 6,
  },
  saveBtn:     { borderRadius: 16, paddingVertical: 17, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#0A0F0D' },

  // Delete button
  deleteBtn: {
    flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: 'rgba(239,68,68,0.35)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },
  deleteBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: RED },
});
