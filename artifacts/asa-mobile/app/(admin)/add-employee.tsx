import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator, Modal, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, departmentApi, ApiError, CreateEmployeeResponse } from '@/services/api';
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

const ROLES = [
  { value: 'EMPLOYEE',            label: 'موظف — Employee' },
  { value: 'RESPONSIBLE_OFFICER', label: 'ضابط مسؤول — Responsible Officer' },
  { value: 'WEEKEND_MANAGER',     label: 'مدير نهاية الأسبوع — Weekend Manager' },
  { value: 'DEPARTMENT_MANAGER',  label: 'مدير قسم — Dept. Manager' },
  { value: 'MAIN_MANAGER',        label: 'المدير العام — Main Manager' },
  { value: 'SYSTEM_ADMIN',        label: 'مشرف النظام — System Admin' },
];

export default function AddEmployeeScreen() {
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();

  const [form, setForm] = useState({
    nationalId:   '',
    firstNameAr:  '',
    middleNameAr: '',
    lastNameAr:   '',
    phoneNumber:  '',
    departmentId: '',
    role:         'EMPLOYEE',
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [deptOpen, setDeptOpen]   = useState(false);
  const [roleOpen, setRoleOpen]   = useState(false);
  const [created, setCreated] = useState<CreateEmployeeResponse | null>(null);

  const { data: deptData } = useQuery({
    queryKey: ['departments', 'all'],
    queryFn:  () => departmentApi.listAll(),
  });
  const departments = deptData?.data ?? [];
  const selectedDept = departments.find(d => d.id === form.departmentId);
  const selectedRole = ROLES.find(r => r.value === form.role);

  const setField = (key: string, val: string) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!/^\d{10}$/.test(form.nationalId))          e.nationalId  = '10-digit national ID required';
    if (!form.firstNameAr.trim())                    e.firstNameAr = 'First name (Arabic) required';
    if (!form.lastNameAr.trim())                     e.lastNameAr  = 'Last name (Arabic) required';
    if (!/^05\d{8}$/.test(form.phoneNumber))        e.phoneNumber = 'Valid Saudi mobile number required (05xxxxxxxx)';
    if (!form.role)                                  e.role        = 'Role is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const mutation = useMutation({
    mutationFn: () => adminApi.createEmployee({
      nationalId:   form.nationalId,
      firstNameAr:  form.firstNameAr.trim(),
      middleNameAr: form.middleNameAr.trim() || undefined,
      lastNameAr:   form.lastNameAr.trim(),
      phoneNumber:  form.phoneNumber,
      departmentId: form.departmentId || undefined,
      role:         form.role,
    }),
    onSuccess: (res) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['admin', 'employees'] });
      setCreated(res.data!);
    },
    onError: (err) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to create employee');
    },
  });

  const handleSubmit = () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    mutation.mutate();
  };

  // ── Success dialog ──────────────────────────────────────────────────────────
  if (created) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successCard}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color={GREEN_MID} />
          </View>
          <Text style={styles.successTitle}>Account Created</Text>
          <Text style={styles.successSubtitle}>تم إنشاء الحساب بنجاح</Text>

          <View style={styles.tempBox}>
            <Text style={styles.tempLabel}>Share these credentials with the employee:</Text>
            <View style={styles.tempRow}>
              <Text style={styles.tempKey}>National ID:</Text>
              <Text style={styles.tempVal}>{created.nationalId}</Text>
            </View>
            <View style={styles.tempRow}>
              <Text style={styles.tempKey}>Temp Password:</Text>
              <Text style={styles.tempVal}>{created.tempPassword}</Text>
            </View>
            <Text style={styles.tempNote}>
              ⚠️ The employee will be asked to change their password on first login.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.replace('/(admin)/employees' as any)}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* Header — navyDark bg */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Add Employee</Text>
          <Text style={styles.headerTitleAr}>إضافة موظف</Text>
        </View>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

        {/* White form card */}
        <View style={styles.formCard}>

          {/* National ID */}
          <Field label="National ID  رقم الهوية" error={errors.nationalId}>
            <TextInput
              style={[styles.input, errors.nationalId ? styles.inputError : null]}
              placeholder="10-digit national ID"
              placeholderTextColor={MUTED}
              value={form.nationalId}
              onChangeText={t => setField('nationalId', t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="number-pad"
              maxLength={10}
            />
          </Field>

          {/* First Name */}
          <Field label="First Name (Arabic)  الاسم الأول" error={errors.firstNameAr}>
            <TextInput
              style={[styles.input, errors.firstNameAr ? styles.inputError : null]}
              placeholder="مثال: محمد"
              placeholderTextColor={MUTED}
              value={form.firstNameAr}
              onChangeText={t => setField('firstNameAr', t)}
              textAlign="right"
            />
          </Field>

          {/* Middle Name (optional) */}
          <Field label="Middle Name (Arabic)  الاسم الأوسط (اختياري)">
            <TextInput
              style={styles.input}
              placeholder="مثال: عبدالله — اختياري"
              placeholderTextColor={MUTED}
              value={form.middleNameAr}
              onChangeText={t => setField('middleNameAr', t)}
              textAlign="right"
            />
          </Field>

          {/* Last Name */}
          <Field label="Last Name (Arabic)  اسم العائلة" error={errors.lastNameAr}>
            <TextInput
              style={[styles.input, errors.lastNameAr ? styles.inputError : null]}
              placeholder="مثال: الغامدي"
              placeholderTextColor={MUTED}
              value={form.lastNameAr}
              onChangeText={t => setField('lastNameAr', t)}
              textAlign="right"
            />
          </Field>

          {/* Phone */}
          <Field label="Phone Number  رقم الجوال" error={errors.phoneNumber}>
            <TextInput
              style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
              placeholder="05xxxxxxxx"
              placeholderTextColor={MUTED}
              value={form.phoneNumber}
              onChangeText={t => setField('phoneNumber', t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </Field>

          {/* Department picker */}
          <Field label="Department  القسم (optional)">
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setDeptOpen(true)}
            >
              <Text style={selectedDept ? styles.pickerValue : styles.pickerPlaceholder}>
                {selectedDept ? selectedDept.nameAr : 'Select department…'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={MUTED} />
            </TouchableOpacity>
          </Field>

          {/* Role picker */}
          <Field label="Role  الصلاحية" error={errors.role}>
            <TouchableOpacity
              style={[styles.picker, errors.role ? styles.inputError : null]}
              onPress={() => setRoleOpen(true)}
            >
              <Text style={selectedRole ? styles.pickerValue : styles.pickerPlaceholder}>
                {selectedRole?.label ?? 'Select role…'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={MUTED} />
            </TouchableOpacity>
          </Field>

        </View>

        <TouchableOpacity
          style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={mutation.isPending}
          activeOpacity={0.82}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Create Account  إنشاء الحساب</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* Department modal */}
      <Modal visible={deptOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setDeptOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>Select Department</Text>
          <TouchableOpacity style={styles.sheetItem} onPress={() => { setField('departmentId', ''); setDeptOpen(false); }}>
            <Text style={styles.sheetItemText}>— None —</Text>
          </TouchableOpacity>
          {departments.map(d => (
            <TouchableOpacity key={d.id} style={styles.sheetItem}
              onPress={() => { setField('departmentId', d.id); setDeptOpen(false); }}>
              <Text style={styles.sheetItemText}>{d.nameAr}</Text>
              {form.departmentId === d.id && <Ionicons name="checkmark" size={18} color={GREEN_MID} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Role modal */}
      <Modal visible={roleOpen} transparent animationType="slide">
        <TouchableOpacity style={styles.overlay} onPress={() => setRoleOpen(false)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <Text style={styles.sheetTitle}>Select Role</Text>
          {ROLES.map(r => (
            <TouchableOpacity key={r.value} style={styles.sheetItem}
              onPress={() => { setField('role', r.value); setRoleOpen(false); }}>
              <Text style={styles.sheetItemText}>{r.label}</Text>
              {form.role === r.value && <Ionicons name="checkmark" size={18} color={GREEN_MID} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: CREAM },

  // Header — navyDark
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 16, paddingVertical: 16,
                      backgroundColor: GREEN_DARK },
  backBtn:          { padding: 4 },
  headerTitle:      { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff', textAlign: 'center' },
  headerTitleAr:    { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  // Form layout
  form:             { padding: 16, gap: 4, paddingBottom: 32 },

  // White form card
  formCard:         { backgroundColor: WHITE, borderRadius: 18, borderWidth: 1, borderColor: BORDER,
                      padding: 20, marginBottom: 4,
                      shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.10, shadowRadius: 16, elevation: 4 },

  fieldGroup:       { marginBottom: 14 },
  label:            { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEXT, marginBottom: 6 },

  // Inputs — white bg, BORDER
  input:            { backgroundColor: WHITE, borderRadius: 12, borderWidth: 1.5,
                      borderColor: BORDER, paddingHorizontal: 14, height: 54,
                      fontSize: 15, fontFamily: 'Inter_400Regular', color: TEXT },
  inputError:       { borderColor: light.destructive },
  errorText:        { color: light.destructive, fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },

  // Picker
  picker:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      backgroundColor: WHITE, borderRadius: 12, borderWidth: 1.5,
                      borderColor: BORDER, paddingHorizontal: 14, height: 54 },
  pickerValue:      { fontSize: 15, fontFamily: 'Inter_400Regular', color: TEXT },
  pickerPlaceholder:{ fontSize: 15, fontFamily: 'Inter_400Regular', color: MUTED },

  // Green submit button
  submitBtn:        { backgroundColor: GREEN_MID, borderRadius: 14,
                      paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitBtnDisabled:{ opacity: 0.6 },
  submitBtnText:    { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },

  // Bottom sheet modals
  overlay:          { flex: 1, backgroundColor: '#00000044' },
  sheet:            { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                      padding: 20, borderWidth: 1, borderColor: BORDER },
  sheetTitle:       { fontSize: 16, fontFamily: 'Inter_700Bold', color: TEXT, marginBottom: 12 },
  sheetItem:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  sheetItemText:    { fontSize: 15, fontFamily: 'Inter_400Regular', color: TEXT },

  // Success state
  successCard:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon:      { marginBottom: 12 },
  successTitle:     { fontSize: 22, fontFamily: 'Inter_700Bold', color: TEXT },
  successSubtitle:  { fontSize: 14, fontFamily: 'Inter_400Regular', color: MUTED, marginBottom: 24 },
  tempBox:          { backgroundColor: WHITE, borderRadius: 16, padding: 20,
                      borderWidth: 1.5, borderColor: BORDER, width: '100%', marginBottom: 24,
                      shadowColor: GREEN_DARK, shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.10, shadowRadius: 16, elevation: 4 },
  tempLabel:        { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: GREEN_DARK, marginBottom: 12 },
  tempRow:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  tempKey:          { fontSize: 14, fontFamily: 'Inter_400Regular', color: GREEN_DARK },
  tempVal:          { fontSize: 14, fontFamily: 'Inter_700Bold', color: GREEN_DARK },
  tempNote:         { fontSize: 12, fontFamily: 'Inter_400Regular', color: MUTED, marginTop: 12, lineHeight: 18 },
  doneBtn:          { backgroundColor: GREEN_MID, borderRadius: 14,
                      paddingVertical: 16, paddingHorizontal: 48 },
  doneBtnText:      { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
