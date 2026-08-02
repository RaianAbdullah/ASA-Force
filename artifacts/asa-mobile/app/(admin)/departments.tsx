/**
 * Admin — Department Management
 * Create, view, update and deactivate departments.
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
import { departmentApi, DepartmentDto, ApiError } from '@/services/api';
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
const RED        = light.destructive;

type FormMode = 'create' | 'edit';

interface DeptForm {
  nameEn: string;
  nameAr: string;
  code:   string;
}

const emptyForm = (): DeptForm => ({ nameEn: '', nameAr: '', code: '' });

export default function DepartmentsScreen() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ visible: boolean; mode: FormMode; dept?: DepartmentDto }>({
    visible: false, mode: 'create',
  });
  const [form, setForm]     = useState<DeptForm>(emptyForm());
  const [formErr, setFormErr] = useState('');

  const { data: departments = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin', 'departments'],
    queryFn: async () => {
      const r = await departmentApi.listAll();
      return r.data ?? [];
    },
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: () => departmentApi.create(form.nameEn.trim(), form.nameAr.trim(), form.code.trim()),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['admin', 'departments'] });
      closeModal();
    },
    onError: (err) => setFormErr(err instanceof ApiError ? err.message : 'Failed to create department'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id }: { id: string }) =>
      departmentApi.update(id, { nameEn: form.nameEn.trim(), nameAr: form.nameAr.trim() }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['admin', 'departments'] });
      closeModal();
    },
    onError: (err) => setFormErr(err instanceof ApiError ? err.message : 'Failed to update department'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => departmentApi.deactivate(id),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['admin', 'departments'] });
    },
    onError: (err) => Alert.alert('Error', err instanceof ApiError ? err.message : 'Failed to deactivate'),
  });

  const openCreate = () => {
    setForm(emptyForm());
    setFormErr('');
    setModal({ visible: true, mode: 'create' });
  };

  const openEdit = (dept: DepartmentDto) => {
    setForm({ nameEn: dept.nameEn, nameAr: dept.nameAr, code: dept.code });
    setFormErr('');
    setModal({ visible: true, mode: 'edit', dept });
  };

  const closeModal = () => {
    setModal(m => ({ ...m, visible: false }));
    setForm(emptyForm());
    setFormErr('');
  };

  const handleSubmit = () => {
    setFormErr('');
    if (!form.nameAr.trim() || !form.nameEn.trim()) {
      setFormErr('Both department names are required');
      return;
    }
    if (modal.mode === 'create' && !form.code.trim()) {
      setFormErr('Department code is required');
      return;
    }
    if (modal.mode === 'create') {
      createMutation.mutate();
    } else if (modal.dept) {
      updateMutation.mutate({ id: modal.dept.id });
    }
  };

  const confirmDeactivate = (dept: DepartmentDto) => {
    Alert.alert(
      'Deactivate Department',
      `Deactivate "${dept.nameAr}"? Employees assigned to it will not be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: () => deactivateMutation.mutate(dept.id) },
      ]
    );
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {/* Header — navyDark bg */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Departments</Text>
          <Text style={styles.titleAr}>الأقسام</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={GREEN_MID} />}
      >
        {isLoading && <ActivityIndicator color={GREEN_MID} style={{ marginTop: 40 }} />}

        {!isLoading && departments.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏢</Text>
            <Text style={styles.emptyTitle}>No Departments Yet</Text>
            <Text style={styles.emptyBody}>Tap "+ New" to create the first department.</Text>
          </View>
        )}

        {departments.map(dept => (
          <View key={dept.id} style={[styles.card, !dept.isActive && styles.cardInactive]}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nameAr}>{dept.nameAr}</Text>
                <Text style={styles.nameEn}>{dept.nameEn}</Text>
                {/* Gold department code badge */}
                <View style={styles.codeBadge}>
                  <Text style={styles.codeBadgeText}>{dept.code}</Text>
                </View>
              </View>
              <View style={[styles.activeBadge,
                { backgroundColor: dept.isActive ? GREEN_MID + '18' : BORDER }]}>
                <Text style={[styles.activeBadgeText, { color: dept.isActive ? GREEN_MID : MUTED }]}>
                  {dept.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>👥 {dept.employeeCount} employees</Text>
              {dept.managerName && <Text style={styles.metaText}>👤 {dept.managerName}</Text>}
            </View>

            {dept.isActive && (
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(dept)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deactivateBtn} onPress={() => confirmDeactivate(dept)}>
                  <Text style={styles.deactivateBtnText}>Deactivate</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Create / Edit Modal */}
      <Modal visible={modal.visible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {modal.mode === 'create' ? 'New Department' : 'Edit Department'}
            </Text>

            {!!formErr && (
              <View style={styles.errorBox}><Text style={styles.errorText}>{formErr}</Text></View>
            )}

            <Text style={styles.label}>Arabic Name *</Text>
            <TextInput
              style={styles.input}
              value={form.nameAr}
              onChangeText={v => setForm(f => ({ ...f, nameAr: v }))}
              placeholder="مثال: قسم تقنية المعلومات"
              placeholderTextColor={MUTED}
              textAlign="right"
            />

            <Text style={styles.label}>English Name *</Text>
            <TextInput
              style={styles.input}
              value={form.nameEn}
              onChangeText={v => setForm(f => ({ ...f, nameEn: v }))}
              placeholder="e.g. Information Technology"
              placeholderTextColor={MUTED}
            />

            {modal.mode === 'create' && (
              <>
                <Text style={styles.label}>Code *</Text>
                <TextInput
                  style={styles.input}
                  value={form.code}
                  onChangeText={v => setForm(f => ({ ...f, code: v.toUpperCase() }))}
                  placeholder="e.g. IT"
                  placeholderTextColor={MUTED}
                  autoCapitalize="characters"
                  maxLength={10}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={closeModal} disabled={isSaving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.5 }]} onPress={handleSubmit} disabled={isSaving}>
                <Text style={styles.saveBtnText}>{isSaving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: CREAM },

  // Header — navyDark
  header:         { flexDirection: 'row', alignItems: 'center', gap: 12,
                    padding: 16, paddingBottom: 14, backgroundColor: GREEN_DARK },
  backBtn:        { padding: 4 },
  backText:       { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontFamily: 'Inter_500Medium' },
  title:          { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  titleAr:        { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  addBtn:         { backgroundColor: GOLD, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText:     { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  scroll:         { padding: 16, paddingBottom: 60 },

  // White list cards
  card:           { backgroundColor: WHITE, borderRadius: 18, padding: 18, marginBottom: 12,
                    borderWidth: 1, borderColor: BORDER,
                    shadowColor: GREEN_DARK, shadowOpacity: 0.10, shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cardInactive:   { opacity: 0.6 },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  nameAr:         { fontSize: 17, fontFamily: 'Inter_700Bold', color: TEXT, textAlign: 'right' },
  nameEn:         { fontSize: 14, fontFamily: 'Inter_400Regular', color: MUTED, marginTop: 2 },

  // Gold department badge
  codeBadge:      { alignSelf: 'flex-start', backgroundColor: GOLD + '22', borderRadius: 8,
                    paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  codeBadgeText:  { fontSize: 11, fontFamily: 'Inter_700Bold', color: GOLD },

  activeBadge:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  activeBadgeText:{ fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  cardMeta:       { flexDirection: 'row', gap: 16, marginBottom: 14 },
  metaText:       { fontSize: 13, fontFamily: 'Inter_400Regular', color: MUTED },
  cardActions:    { flexDirection: 'row', gap: 10 },
  editBtn:        { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
                    paddingVertical: 10, alignItems: 'center', backgroundColor: WHITE },
  editBtnText:    { color: TEXT, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  deactivateBtn:  { flex: 1, borderWidth: 1.5, borderColor: RED, borderRadius: 12,
                    paddingVertical: 10, alignItems: 'center' },
  deactivateBtnText: { color: RED, fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  empty:          { alignItems: 'center', paddingTop: 60 },
  emptyIcon:      { fontSize: 56, marginBottom: 16 },
  emptyTitle:     { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: MUTED, marginBottom: 8 },
  emptyBody:      { fontSize: 14, fontFamily: 'Inter_400Regular', color: MUTED, textAlign: 'center' },

  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: WHITE, borderTopLeftRadius: 24, borderTopRightRadius: 24,
                    padding: 24, borderWidth: 1, borderColor: BORDER },
  modalTitle:     { fontSize: 20, fontFamily: 'Inter_700Bold', color: TEXT, marginBottom: 16 },
  label:          { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: TEXT, marginBottom: 6 },
  input:          { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingHorizontal: 14,
                    height: 54, fontSize: 15, fontFamily: 'Inter_400Regular', color: TEXT,
                    backgroundColor: WHITE, marginBottom: 14 },
  errorBox:       { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, marginBottom: 12,
                    borderWidth: 1, borderColor: '#FECACA' },
  errorText:      { color: RED, fontSize: 13, fontFamily: 'Inter_400Regular' },
  modalActions:   { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn:      { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 14,
                    paddingVertical: 14, alignItems: 'center', backgroundColor: WHITE },
  cancelBtnText:  { color: MUTED, fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  saveBtn:        { flex: 1, backgroundColor: GREEN_MID, borderRadius: 14,
                    paddingVertical: 14, alignItems: 'center' },
  saveBtnText:    { color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 },
});
