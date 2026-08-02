/**
 * الإشعارات والتبليغات — Midnight Glass design, Arabic UI
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Modal, KeyboardAvoidingView,
  Platform, ScrollView, RefreshControl, Pressable, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { announcementApi, AnnouncementDto, ReplyDto, ApiError } from '@/services/api';
import { loadSession } from '@/services/auth';

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

const POSTER_ROLES = ['SYSTEM_ADMIN', 'MAIN_MANAGER'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'الآن';
  if (mins < 60) return `منذ ${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `منذ ${hrs} س`;
  return `منذ ${Math.floor(hrs / 24)} يوم`;
}

function containsEmoji(text: string): boolean {
  return /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}]/u.test(text);
}

// ── Thread modal ──────────────────────────────────────────────────────────────

function ThreadModal({
  announcement, visible, onClose, myRole,
}: {
  announcement: AnnouncementDto | null;
  visible: boolean;
  onClose: () => void;
  myRole: string;
}) {
  const qc     = useQueryClient();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  const { data: thread, isLoading } = useQuery({
    queryKey: ['announcement-thread', announcement?.id],
    queryFn:  () => announcementApi.getThread(announcement!.id),
    enabled:  visible && !!announcement,
  });

  const replyMut = useMutation({
    mutationFn: (body: string) => announcementApi.reply(announcement!.id, body),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['announcement-thread', announcement?.id] });
      qc.invalidateQueries({ queryKey: ['announcements'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: ApiError) => Alert.alert('خطأ', e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => announcementApi.delete(announcement!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      onClose();
    },
    onError: (e: ApiError) => Alert.alert('خطأ', e.message),
  });

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (containsEmoji(trimmed)) {
      Alert.alert('غير مسموح', 'لا يُسمح باستخدام الرموز التعبيرية.');
      return;
    }
    replyMut.mutate(trimmed);
  }

  function handleDelete() {
    Alert.alert(
      'حذف التبليغ',
      'سيتم حذف هذا التبليغ وجميع الردود عليه نهائياً.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => deleteMut.mutate() },
      ],
    );
  }

  const canDelete = POSTER_ROLES.includes(myRole);
  const replies: ReplyDto[] = thread?.data?.replies ?? [];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: BG }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <SafeAreaView style={[styles.modalHeader, { paddingTop: insets.top + 4 }]} edges={[]}>
          <View style={styles.headerGlow} />
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>التبليغ</Text>
          {canDelete ? (
            <TouchableOpacity onPress={handleDelete} style={styles.headerBtn} disabled={deleteMut.isPending}>
              <Ionicons name="trash-outline" size={20} color={RED} />
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
        </SafeAreaView>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 12 }}
          keyboardDismissMode="interactive"
        >
          {/* Announcement body */}
          {announcement && (
            <View style={styles.threadBody}>
              {announcement.pinned && (
                <View style={styles.pinnedBadge}>
                  <Ionicons name="pin" size={12} color={GOLD} />
                  <Text style={styles.pinnedText}>مثبّت</Text>
                </View>
              )}
              <Text style={styles.threadTitle}>{announcement.title}</Text>
              <Text style={styles.threadBodyText}>{announcement.body}</Text>
              <Text style={styles.threadMeta}>
                {announcement.authorNameAr} · {timeAgo(announcement.createdAt)}
              </Text>
            </View>
          )}

          {/* Replies header */}
          <Text style={styles.repliesLabel}>
            {replies.length === 0 ? 'لا توجد ردود بعد' : `${replies.length} ${replies.length === 1 ? 'رد' : 'ردود'}`}
          </Text>
          {isLoading && <ActivityIndicator color={NEON} style={{ marginTop: 12 }} />}
          {replies.map(r => (
            <View key={r.id} style={styles.replyCard}>
              <View style={styles.replyAvatar}>
                <Text style={styles.replyAvatarText}>{r.authorNameAr.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.replyAuthor}>{r.authorNameAr}</Text>
                <Text style={styles.replyText}>{r.body}</Text>
                <Text style={styles.replyTime}>{timeAgo(r.createdAt)}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Reply input */}
        <View style={[styles.replyInputRow, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[styles.replySendBtn, (!text.trim() || replyMut.isPending) && styles.replySendBtnOff]}
            onPress={handleSend}
            disabled={!text.trim() || replyMut.isPending}
          >
            {replyMut.isPending
              ? <ActivityIndicator color={BG} size="small" />
              : <Ionicons name="send" size={18} color={BG} />}
          </TouchableOpacity>
          <TextInput
            style={styles.replyInput}
            placeholder="اكتب ردًّا…"
            placeholderTextColor={MUTED}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            textAlign="right"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── New announcement modal (managers only) ────────────────────────────────────

function NewAnnouncementModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const [title,  setTitle]  = useState('');
  const [body,   setBody]   = useState('');
  const [pinned, setPinned] = useState(false);

  const createMut = useMutation({
    mutationFn: () => announcementApi.create(title.trim(), body.trim(), pinned),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      setTitle(''); setBody(''); setPinned(false);
      onClose();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: ApiError) => Alert.alert('خطأ', e.message),
  });

  function handlePost() {
    if (!title.trim() || !body.trim()) {
      Alert.alert('حقول ناقصة', 'العنوان والمحتوى مطلوبان.');
      return;
    }
    if (containsEmoji(title) || containsEmoji(body)) {
      Alert.alert('غير مسموح', 'لا يُسمح باستخدام الرموز التعبيرية.');
      return;
    }
    createMut.mutate();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: BG }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={[styles.modalHeader, { paddingTop: insets.top + 4 }]} edges={[]}>
          <View style={styles.headerGlow} />
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={22} color={WHITE} />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>تبليغ جديد</Text>
          <TouchableOpacity
            style={[styles.postBtn, (!title.trim() || !body.trim() || createMut.isPending) && { opacity: 0.4 }]}
            onPress={handlePost}
            disabled={!title.trim() || !body.trim() || createMut.isPending}
          >
            {createMut.isPending
              ? <ActivityIndicator color={BG} size="small" />
              : <Text style={styles.postBtnText}>نشر</Text>}
          </TouchableOpacity>
        </SafeAreaView>

        <ScrollView style={{ flex: 1, padding: 16 }} keyboardDismissMode="interactive">
          <Text style={styles.formLabel}>العنوان</Text>
          <TextInput
            style={styles.formInput}
            placeholder="عنوان التبليغ…"
            placeholderTextColor={MUTED}
            value={title}
            onChangeText={setTitle}
            maxLength={200}
            textAlign="right"
          />

          <Text style={styles.formLabel}>المحتوى</Text>
          <TextInput
            style={[styles.formInput, { height: 160, textAlignVertical: 'top' }]}
            placeholder="اكتب محتوى التبليغ هنا…"
            placeholderTextColor={MUTED}
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={5000}
            textAlign="right"
          />

          <TouchableOpacity style={styles.pinnedToggle} onPress={() => setPinned(p => !p)}>
            <Ionicons
              name={pinned ? 'checkbox' : 'square-outline'}
              size={22}
              color={pinned ? NEON : MUTED}
            />
            <Text style={[styles.pinnedToggleText, pinned && { color: NEON }]}>
              تثبيت هذا التبليغ
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Announcement card ─────────────────────────────────────────────────────────

function AnnouncementCard({ item, onPress }: { item: AnnouncementDto; onPress: () => void }) {
  const isNew = Date.now() - new Date(item.createdAt).getTime() < 86_400_000;
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          {item.pinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={11} color={GOLD} />
              <Text style={styles.pinnedText}>مثبّت</Text>
            </View>
          )}
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        </View>
        {isNew && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>جديد</Text>
          </View>
        )}
        <Ionicons name="chevron-back" size={18} color={MUTED} />
      </View>
      <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.replyCountBadge}>
          <Ionicons name="chatbubble-outline" size={12} color={NEON} />
          <Text style={styles.replyCountText}>{item.replyCount}</Text>
        </View>
        <Text style={styles.cardMeta}>{item.authorNameAr} · {timeAgo(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AnnouncementsScreen() {
  const insets = useSafeAreaInsets();
  const [myRole, setMyRole] = useState('');
  React.useEffect(() => {
    loadSession().then(s => { if (s?.role) setMyRole(s.role); });
  }, []);

  const [selectedItem, setSelectedItem] = useState<AnnouncementDto | null>(null);
  const [showThread,   setShowThread]   = useState(false);
  const [showNew,      setShowNew]      = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['announcements'],
    queryFn:  announcementApi.list,
  });

  const canPost = POSTER_ROLES.includes(myRole);

  function openThread(item: AnnouncementDto) {
    setSelectedItem(item);
    setShowThread(true);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerGlow} />
        <View>
          <Text style={styles.headerTitle}>الإشعارات والتبليغات</Text>
          <Text style={styles.headerSub}>تبليغات الإدارة والفريق</Text>
        </View>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
          {isRefetching
            ? <ActivityIndicator size="small" color={NEON} />
            : <Ionicons name="refresh-outline" size={22} color={MUTED} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={data?.data ?? []}
        keyExtractor={i => i.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={NEON}
          />
        }
        ListEmptyComponent={
          isLoading
            ? <ActivityIndicator color={NEON} style={{ marginTop: 60 }} />
            : (
              <View style={styles.emptyWrap}>
                <Ionicons name="megaphone-outline" size={52} color={MUTED} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>لا توجد تبليغات بعد</Text>
                <Text style={styles.emptySub}>ستظهر هنا تبليغات الإدارة</Text>
              </View>
            )
        }
        renderItem={({ item }) => (
          <AnnouncementCard item={item} onPress={() => openThread(item)} />
        )}
      />

      {/* FAB — managers only */}
      {canPost && (
        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 90 }]}
          onPress={() => setShowNew(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[NEON, NEON2]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={28} color={BG} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <ThreadModal
        announcement={selectedItem}
        visible={showThread}
        onClose={() => setShowThread(false)}
        myRole={myRole}
      />
      <NewAnnouncementModal visible={showNew} onClose={() => setShowNew(false)} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: BG },

  // Header
  header: {
    paddingHorizontal: 20, paddingBottom: 16, overflow: 'hidden',
    flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end',
    backgroundColor: BG,
  },
  headerGlow: {
    position: 'absolute', top: -30, right: -20,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(201,150,63,0.07)',
  },
  headerTitle: { fontSize: 20, fontFamily: 'Inter_700Bold', color: WHITE, textAlign: 'right' },
  headerSub:   { fontSize: 12, color: MUTED, marginTop: 2, textAlign: 'right' },
  refreshBtn:  { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.07)' },

  // List
  listContent: { paddingHorizontal: 14, paddingTop: 12 },

  // Cards
  card: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  cardTop:   { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: WHITE, flexShrink: 1, textAlign: 'right' },
  cardBody:  { fontSize: 13, color: MUTED, lineHeight: 20, marginBottom: 10, textAlign: 'right' },
  cardFooter:{ flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  cardMeta:  { fontSize: 12, color: MUTED },

  newBadge:     { backgroundColor: GOLD, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  newBadgeText: { fontSize: 10, color: BG, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },

  replyCountBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,230,118,0.1)', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  replyCountText: { fontSize: 12, color: NEON, fontFamily: 'Inter_600SemiBold' },

  pinnedBadge: { flexDirection: 'row-reverse', alignItems: 'center', gap: 3, marginBottom: 4 },
  pinnedText:  { fontSize: 11, color: GOLD, fontFamily: 'Inter_600SemiBold' },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: MUTED, marginBottom: 4 },
  emptySub:  { fontSize: 13, color: MUTED },

  // FAB
  fab:         { position: 'absolute', right: 20 },
  fabGradient: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: NEON, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },

  // Modal header
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 14,
    backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  modalHeaderTitle: {
    flex: 1, textAlign: 'center', fontSize: 16, fontFamily: 'Inter_700Bold', color: WHITE,
  },
  headerBtn: { width: 40, alignItems: 'center', padding: 4 },

  // Thread body
  threadBody: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  threadTitle:    { fontSize: 18, fontFamily: 'Inter_700Bold', color: WHITE, marginBottom: 10, textAlign: 'right' },
  threadBodyText: { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 22, textAlign: 'right' },
  threadMeta:     { marginTop: 12, fontSize: 12, color: MUTED, textAlign: 'right' },

  repliesLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: MUTED, marginBottom: 10, textAlign: 'right' },

  replyCard:       { flexDirection: 'row-reverse', gap: 10, marginBottom: 14 },
  replyAvatar:     {
    width: 36, height: 36, borderRadius: 99,
    backgroundColor: 'rgba(201,150,63,0.3)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  replyAvatarText: { fontSize: 14, fontFamily: 'Inter_700Bold', color: GOLD },
  replyAuthor:     { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: WHITE, textAlign: 'right' },
  replyText:       { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginTop: 2, textAlign: 'right' },
  replyTime:       { fontSize: 11, color: MUTED, marginTop: 4, textAlign: 'right' },

  replyInputRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(10,15,13,0.98)', alignItems: 'flex-end',
  },
  replyInput: {
    flex: 1, minHeight: 42, maxHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: WHITE,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  replySendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: NEON,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: NEON, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45, shadowRadius: 8, elevation: 5,
  },
  replySendBtnOff: { backgroundColor: 'rgba(255,255,255,0.10)', shadowOpacity: 0 },

  // New announcement form
  formLabel: {
    fontSize: 13, fontFamily: 'Inter_600SemiBold', color: MUTED,
    marginBottom: 6, marginTop: 20, textAlign: 'right',
  },
  formInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: WHITE,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', height: 54,
  },
  pinnedToggle:     { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 20 },
  pinnedToggleText: { fontSize: 14, color: MUTED },

  postBtn:     {
    backgroundColor: NEON, paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 10,
  },
  postBtnText: { color: BG, fontSize: 14, fontFamily: 'Inter_700Bold' },
});
