/**
 * Admin — All Employees (Midnight Glass design)
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { adminApi, EmployeeSummaryDto } from '@/services/api';

// ── Midnight Glass palette ────────────────────────────────────────────────────
const BG      = '#0A0F0D';
const SURFACE = 'rgba(255,255,255,0.07)';
const BORDER  = 'rgba(255,255,255,0.12)';
const NEON    = '#00E676';
const GOLD    = '#C9963F';
const WHITE   = '#FFFFFF';
const MUTED   = 'rgba(255,255,255,0.55)';
const RED     = '#EF4444';

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CONFIG: Record<string, { labelAr: string; color: string }> = {
  SYSTEM_ADMIN:        { labelAr: 'مشرف النظام',       color: RED },
  MAIN_MANAGER:        { labelAr: 'المدير العام',       color: GOLD },
  DEPARTMENT_MANAGER:  { labelAr: 'مدير القسم',         color: '#60A5FA' },
  WEEKEND_MANAGER:     { labelAr: 'مدير نهاية الأسبوع', color: '#A78BFA' },
  RESPONSIBLE_OFFICER: { labelAr: 'ضابط مسؤول',         color: '#FB923C' },
  EMPLOYEE:            { labelAr: 'موظف',               color: NEON },
};

const STATUS_CONFIG: Record<string, { labelAr: string; color: string }> = {
  ACTIVE:               { labelAr: 'نشط',                color: NEON },
  PENDING_VERIFICATION: { labelAr: 'انتظار التحقق',      color: '#F59E0B' },
  PENDING_APPROVAL:     { labelAr: 'انتظار الموافقة',    color: '#F59E0B' },
  SUSPENDED:            { labelAr: 'موقوف',              color: RED },
  REJECTED:             { labelAr: 'مرفوض',              color: MUTED as string },
};

/** Shows only the last 4 digits: ••••••1234 */
function maskNationalId(id?: string): string {
  if (!id || id.length < 4) return id ?? '—';
  return '•'.repeat(id.length - 4) + id.slice(-4);
}

function RolePill({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;
  return (
    <View style={[styles.rolePill, { backgroundColor: cfg.color + '18', borderColor: cfg.color + '40' }]}>
      <Text style={[styles.rolePillText, { color: cfg.color }]}>{cfg.labelAr}</Text>
    </View>
  );
}

export default function EmployeesScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['admin', 'employees', 'all'],
    queryFn:  () => adminApi.listAllEmployees(),
  });

  const all: EmployeeSummaryDto[] = data?.data ?? [];
  const filtered = search.trim()
    ? all.filter(e => `${e.firstNameAr} ${e.lastNameAr} ${e.nationalId}`.includes(search.trim()))
    : all;

  const renderItem = ({ item }: { item: EmployeeSummaryDto }) => {
    const statusCfg = STATUS_CONFIG[item.status ?? ''] ?? { labelAr: item.status ?? '', color: MUTED as string };
    const roles = item.roles?.length ? item.roles : [item.role];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.78}
        onPress={() => router.push({
          pathname: '/(admin)/edit-employee' as any,
          params: {
            id:           item.id,
            nationalId:   item.nationalId,
            firstNameAr:  item.firstNameAr,
            middleNameAr: item.middleNameAr ?? '',
            lastNameAr:   item.lastNameAr,
            roles:        JSON.stringify(roles),
            status:       item.status ?? 'ACTIVE',
            vacationDays: String(item.vacationDaysPerYear ?? 21),
          },
        })}
      >
        {/* Avatar */}
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.firstNameAr?.[0] ?? '?'}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 6 }}>
          {/* Name row */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.firstNameAr} {item.lastNameAr}</Text>
            {/* Status pill */}
            <View style={[styles.statusPill, {
              backgroundColor: statusCfg.color + '18',
              borderColor: statusCfg.color + '40',
            }]}>
              <View style={[styles.statusDot, { backgroundColor: statusCfg.color }]} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.labelAr}</Text>
            </View>
          </View>

          {/* National ID (masked) */}
          <Text style={styles.natId}>{maskNationalId(item.nationalId)}</Text>

          {/* Department */}
          {item.departmentNameAr ? (
            <Text style={styles.dept}>{item.departmentNameAr}</Text>
          ) : null}

          {/* Role pills */}
          <View style={styles.rolePillsRow}>
            {roles.map(r => <RolePill key={r} role={r} />)}
          </View>
        </View>

        <Ionicons name="chevron-back" size={16} color={MUTED} style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Glow */}
      <View style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-forward" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>جميع الموظفين</Text>
          {!isLoading && (
            <Text style={styles.titleSub}>{all.length} موظف مسجل</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/(admin)/add-employee' as any)}
        >
          <Ionicons name="person-add-outline" size={20} color={NEON} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={MUTED} />
        <TextInput
          style={styles.searchInput}
          placeholder="البحث بالاسم أو رقم الهوية…"
          placeholderTextColor={MUTED}
          value={search}
          onChangeText={setSearch}
          textAlign="right"
          selectionColor={NEON}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={MUTED} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Content */}
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={NEON} size="large" />
      ) : isError ? (
        <View style={styles.center}>
          <Ionicons name="warning-outline" size={48} color={RED} />
          <Text style={styles.errorText}>فشل تحميل الموظفين</Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={NEON} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color={MUTED} />
              <Text style={styles.emptyText}>لا يوجد موظفون</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  glow: {
    position: 'absolute', top: -30, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(0,230,118,0.06)', pointerEvents: 'none',
  },

  // Header
  header: {
    flexDirection: 'row-reverse', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: { padding: 8, borderRadius: 20, backgroundColor: SURFACE },
  title:   { fontSize: 18, fontFamily: 'Inter_700Bold', color: WHITE, textAlign: 'right' },
  titleSub:{ fontSize: 12, color: MUTED, textAlign: 'right', marginTop: 2 },
  addBtn:  { padding: 10, borderRadius: 20, backgroundColor: SURFACE,
             borderWidth: 1, borderColor: 'rgba(0,230,118,0.3)' },

  // Search
  searchRow: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    margin: 14,
    backgroundColor: SURFACE, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular', color: WHITE,
  },

  list: { paddingHorizontal: 14, paddingBottom: 32, gap: 10 },

  // Employee card
  card: {
    flexDirection: 'row-reverse', alignItems: 'flex-start',
    backgroundColor: SURFACE, borderRadius: 18, padding: 14,
    borderWidth: 1, borderColor: BORDER, gap: 12,
  },
  avatarRing: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 1.5, borderColor: 'rgba(0,230,118,0.3)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatar:     { width: 40, height: 40, borderRadius: 20,
                backgroundColor: 'rgba(0,230,118,0.15)',
                alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontFamily: 'Inter_700Bold', color: NEON },

  nameRow:  { flexDirection: 'row-reverse', alignItems: 'center',
              justifyContent: 'space-between', gap: 8 },
  name:     { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: WHITE, textAlign: 'right', flex: 1 },
  natId:    { fontSize: 12, color: MUTED, textAlign: 'right', fontFamily: 'Inter_400Regular', letterSpacing: 0.5 },
  dept:     { fontSize: 12, color: MUTED, textAlign: 'right' },

  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, flexShrink: 0,
  },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  rolePillsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
  rolePill: {
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1,
  },
  rolePillText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },

  center:    { alignItems: 'center', marginTop: 80, gap: 12 },
  errorText: { color: RED, fontSize: 15, fontFamily: 'Inter_500Medium' },
  retryBtn:  { backgroundColor: SURFACE, borderRadius: 14, borderWidth: 1,
               borderColor: BORDER, paddingHorizontal: 20, paddingVertical: 12 },
  retryText: { color: WHITE, fontFamily: 'Inter_600SemiBold' },
  emptyText: { color: MUTED, fontSize: 15, fontFamily: 'Inter_400Regular' },
});
