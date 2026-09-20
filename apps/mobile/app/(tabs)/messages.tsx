/**
 * Messages — Midnight Glass design, group chat with file/image attachments
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StatusBar, Pressable, Image, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageApi, MessageDto, AttachmentFile, ApiError, BASE_URL } from '@/services/api';
import { loadSession, Session } from '@/services/auth';

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - d.getTime()) / 60_000);
  if (diffMins < 1)  return 'الآن';
  if (diffMins < 60) return `${diffMins}د`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24)    return `${diffH}س`;
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}

function avatarLetter(name: string): string {
  return name?.trim()?.[0] ?? '?';
}

/** Full URL for an attachment path returned by the server */
function attachmentSrc(url: string): string {
  return url.startsWith('http') ? url : `${BASE_URL}${url}`;
}

// ── Attachment bubble content ─────────────────────────────────────────────────

function AttachmentContent({ msg, isMine }: { msg: MessageDto; isMine: boolean }) {
  if (!msg.attachmentUrl) return null;
  const src = attachmentSrc(msg.attachmentUrl);
  const textColor = isMine ? '#0A0F0D' : WHITE;

  if (msg.attachmentType === 'image') {
    return (
      <TouchableOpacity onPress={() => Linking.openURL(src)} activeOpacity={0.88}>
        <Image
          source={{ uri: src }}
          style={styles.attachmentImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  // Generic file card
  return (
    <TouchableOpacity
      style={[styles.fileCard, isMine && styles.fileCardMine]}
      onPress={() => Linking.openURL(src)}
      activeOpacity={0.8}
    >
      <Ionicons name="document-outline" size={22} color={isMine ? '#0A0F0D' : NEON} />
      <Text
        style={[styles.fileName, { color: textColor }]}
        numberOfLines={2}
      >
        {msg.attachmentName ?? 'ملف'}
      </Text>
      <Ionicons name="download-outline" size={18} color={isMine ? '#0A0F0D88' : MUTED} />
    </TouchableOpacity>
  );
}

// ── Bubble ───────────────────────────────────────────────────────────────────

function Bubble({
  msg, isMine, onLongPress,
}: {
  msg: MessageDto;
  isMine: boolean;
  onLongPress: () => void;
}) {
  const hasBody = msg.body && msg.body.trim().length > 0;

  return (
    <Pressable onLongPress={onLongPress} delayLongPress={450} style={styles.bubbleRow(isMine) as any}>
      {!isMine && (
        <View style={styles.bubbleAvatar}>
          <Text style={styles.bubbleAvatarText}>{avatarLetter(msg.senderNameAr)}</Text>
        </View>
      )}

      <View style={[styles.bubbleMax, isMine && { alignItems: 'flex-end' }]}>
        {!isMine && (
          <Text style={styles.bubbleName}>{msg.senderNameAr}</Text>
        )}

        {isMine ? (
          <LinearGradient
            colors={[NEON, NEON2]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleMine]}
          >
            <AttachmentContent msg={msg} isMine />
            {hasBody && (
              <Text style={[styles.bubbleMineText, msg.attachmentUrl ? { marginTop: 6 } : undefined]}>
                {msg.body}
              </Text>
            )}
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.bubbleOther]}>
            <AttachmentContent msg={msg} isMine={false} />
            {hasBody && (
              <Text style={[styles.bubbleOtherText, msg.attachmentUrl ? { marginTop: 6 } : undefined]}>
                {msg.body}
              </Text>
            )}
          </View>
        )}

        <Text style={[styles.bubbleTime, isMine && { textAlign: 'right' }]}>
          {timeLabel(msg.sentAt)}
        </Text>
      </View>

      {isMine && <View style={{ width: 36 }} />}
    </Pressable>
  );
}

// ── Attachment preview strip ──────────────────────────────────────────────────

function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: AttachmentFile;
  onRemove: () => void;
}) {
  const isImage = attachment.mimeType.startsWith('image/');
  return (
    <View style={styles.previewBar}>
      {isImage ? (
        <Image source={{ uri: attachment.uri }} style={styles.previewImage} resizeMode="cover" />
      ) : (
        <View style={styles.previewFileIcon}>
          <Ionicons name="document-outline" size={20} color={NEON} />
        </View>
      )}
      <Text style={styles.previewName} numberOfLines={1}>{attachment.name}</Text>
      <TouchableOpacity onPress={onRemove} style={styles.previewRemove} hitSlop={8}>
        <Ionicons name="close-circle" size={20} color={MUTED} />
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const qc     = useQueryClient();
  const [session, setSession]       = useState<Session | null>(null);
  const [draft, setDraft]           = useState('');
  const [attachment, setAttachment] = useState<AttachmentFile | null>(null);
  const listRef    = useRef<FlatList>(null);
  const lastSeenAt = useRef<string | null>(null);

  useEffect(() => {
    loadSession().then(s => s && setSession(s));
  }, []);

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey:  ['messages'],
    queryFn:   () => messageApi.list(),
    enabled:   !!session,
    staleTime: 0,
  });

  const messages: MessageDto[] = data?.data ?? [];

  useEffect(() => {
    if (messages.length) {
      lastSeenAt.current = messages[messages.length - 1].sentAt;
    }
  }, [messages.length]);

  // Polling
  useEffect(() => {
    if (!session) return;
    const id = setInterval(async () => {
      if (!lastSeenAt.current) return;
      try {
        const res = await messageApi.listAfter(lastSeenAt.current);
        const newer: MessageDto[] = res?.data ?? [];
        if (!newer.length) return;
        lastSeenAt.current = newer[newer.length - 1].sentAt;
        qc.setQueryData(['messages'], (old: any) => {
          const existing: MessageDto[] = old?.data ?? [];
          const existingIds = new Set(existing.map(m => m.id));
          const fresh = newer.filter(m => !existingIds.has(m.id));
          if (!fresh.length) return old;
          return { ...old, data: [...existing, ...fresh] };
        });
      } catch { /* ignore poll errors */ }
    }, 5_000);
    return () => clearInterval(id);
  }, [session]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // ── Send logic ──────────────────────────────────────────────────────────

  const appendMessage = (msg: MessageDto) => {
    lastSeenAt.current = msg.sentAt;
    qc.setQueryData(['messages'], (old: any) => ({
      ...old,
      data: [...(old?.data ?? []), msg],
    }));
  };

  const sendMutation = useMutation({
    mutationFn: (body: string) => messageApi.send(body),
    onSuccess: (res) => {
      if (res?.data) appendMessage(res.data);
      setDraft('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (e: any) => Alert.alert('خطأ', e?.message ?? 'فشل الإرسال'),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, body }: { file: AttachmentFile; body?: string }) =>
      messageApi.sendWithAttachment(file, body),
    onSuccess: (res) => {
      if (res?.data) appendMessage(res.data);
      setDraft('');
      setAttachment(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    onError: (e: any) => Alert.alert('خطأ', e?.message ?? 'فشل رفع الملف'),
  });

  const isSending = sendMutation.isPending || uploadMutation.isPending;

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if ((!text && !attachment) || isSending) return;

    if (attachment) {
      uploadMutation.mutate({ file: attachment, body: text || undefined });
    } else {
      sendMutation.mutate(text);
    }
  }, [draft, attachment, isSending, sendMutation, uploadMutation]);

  // ── Attachment picker ───────────────────────────────────────────────────

  const pickAttachment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('إضافة مرفق', 'اختر نوع الملف', [
      {
        text: '🖼️  صورة من المعرض',
        onPress: async () => {
          const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('تنبيه', 'يرجى السماح بالوصول إلى الصور من الإعدادات.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.85,
            allowsEditing: false,
          });
          if (!result.canceled && result.assets.length > 0) {
            const asset = result.assets[0];
            const name  = asset.fileName ?? `photo_${Date.now()}.jpg`;
            const mime  = asset.mimeType ?? 'image/jpeg';
            setAttachment({ uri: asset.uri, name, mimeType: mime });
          }
        },
      },
      {
        text: '📎  ملف أو مستند',
        onPress: async () => {
          const result = await DocumentPicker.getDocumentAsync({
            type: '*/*',
            copyToCacheDirectory: true,
          });
          if (!result.canceled && result.assets.length > 0) {
            const asset = result.assets[0];
            setAttachment({
              uri:      asset.uri,
              name:     asset.name,
              mimeType: asset.mimeType ?? 'application/octet-stream',
            });
          }
        },
      },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  };

  // ── Delete ──────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: (id: string) => messageApi.delete(id),
    onSuccess: (_, id) => {
      qc.setQueryData(['messages'], (old: any) => ({
        ...old,
        data: (old?.data ?? []).filter((m: MessageDto) => m.id !== id),
      }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (e: any) => Alert.alert('خطأ', e?.message ?? 'فشل الحذف'),
  });

  const handleLongPress = useCallback((msg: MessageDto) => {
    const isMine  = msg.senderId === session?.employeeId;
    const isAdmin = (session?.roles ?? [session?.role ?? '']).some(r =>
      ['SYSTEM_ADMIN', 'MAIN_MANAGER', 'DEPARTMENT_MANAGER'].includes(r)
    );
    if (!isMine && !isAdmin) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'حذف الرسالة', 'هل تريد حذف هذه الرسالة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'حذف', style: 'destructive', onPress: () => deleteMutation.mutate(msg.id) },
      ],
    );
  }, [session, deleteMutation]);

  // ── Render ──────────────────────────────────────────────────────────────

  if (!session || isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={NEON} size="large" />
      </View>
    );
  }

  const canSend = (draft.trim().length > 0 || !!attachment) && !isSending;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerGlow} />
        <View>
          <Text style={styles.headerTitle}>الرسائل</Text>
          <Text style={styles.headerSub}>محادثة الفريق</Text>
        </View>
        <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
          {isRefetching
            ? <ActivityIndicator size="small" color={NEON} />
            : <Ionicons name="refresh-outline" size={22} color={MUTED} />}
        </TouchableOpacity>
      </View>

      {/* Message list + input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 88 },
          ]}
          renderItem={({ item }) => (
            <Bubble
              msg={item}
              isMine={item.senderId === session.employeeId}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="chatbubbles-outline" size={52} color={MUTED} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>لا توجد رسائل بعد</Text>
              <Text style={styles.emptySub}>كن أول من يبدأ المحادثة</Text>
            </View>
          }
          onContentSizeChange={() => {
            if (messages.length) listRef.current?.scrollToEnd({ animated: false });
          }}
          showsVerticalScrollIndicator={false}
        />

        {/* Input area */}
        <View style={[styles.inputArea, { paddingBottom: insets.bottom + 4 }]}>

          {/* Attachment preview */}
          {attachment && (
            <AttachmentPreview
              attachment={attachment}
              onRemove={() => setAttachment(null)}
            />
          )}

          {/* Input bar */}
          <View style={styles.inputBar}>
            {/* Attach button — rightmost in RTL */}
            <TouchableOpacity
              style={styles.attachBtn}
              onPress={pickAttachment}
              disabled={isSending}
              activeOpacity={0.75}
            >
              <Ionicons
                name={attachment ? 'attach' : 'attach-outline'}
                size={22}
                color={attachment ? NEON : MUTED}
              />
            </TouchableOpacity>

            {/* Text input */}
            <TextInput
              style={styles.input}
              placeholder="اكتب رسالة…"
              placeholderTextColor={MUTED}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={2000}
              textAlign="right"
              returnKeyType="default"
            />

            {/* Send button — leftmost in RTL */}
            <TouchableOpacity
              style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              {isSending
                ? <ActivityIndicator size="small" color="#0A0F0D" />
                : <Ionicons name="send" size={18} color="#0A0F0D" />}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: BG, paddingBottom: 70 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BG },

  // Header
  header:     { paddingHorizontal: 20, paddingBottom: 16, overflow: 'hidden', position: 'relative',
                flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-end',
                backgroundColor: BG },
  headerGlow: { position: 'absolute', top: -30, right: -20, width: 130, height: 130, borderRadius: 65,
                backgroundColor: 'rgba(0,230,118,0.06)' },
  headerTitle:{ fontSize: 20, fontFamily: 'Inter_700Bold', color: WHITE, textAlign: 'right' },
  headerSub:  { fontSize: 12, color: MUTED, marginTop: 2, textAlign: 'right' },
  refreshBtn: { padding: 8, borderRadius: 20, backgroundColor: SURFACE },

  // List
  listContent:{ paddingHorizontal: 12, paddingTop: 12, flexGrow: 1 },

  // Empty state
  emptyWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText:  { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: MUTED, marginBottom: 4 },
  emptySub:   { fontSize: 13, color: MUTED },

  // Bubbles
  bubbleRow: (isMine: boolean) => ({
    flexDirection: isMine ? 'row-reverse' : 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 8,
  }),
  bubbleMax:  { maxWidth: '78%' },
  bubbleAvatar:{
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(201,150,63,0.5)',
    borderWidth: 1, borderColor: 'rgba(201,150,63,0.4)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bubbleAvatarText:{ fontSize: 13, fontFamily: 'Inter_700Bold', color: WHITE },
  bubbleName: { fontSize: 11, fontFamily: 'Inter_600SemiBold', color: GOLD,
                marginBottom: 3, paddingHorizontal: 4 },
  bubble:     { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  bubbleMine: { borderBottomRightRadius: 4 },
  bubbleOther:{ backgroundColor: SURFACE, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: BORDER },
  bubbleMineText:  { fontSize: 14, color: '#0A0F0D', lineHeight: 20, fontFamily: 'Inter_500Medium' },
  bubbleOtherText: { fontSize: 14, color: WHITE, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: MUTED, marginTop: 3, paddingHorizontal: 4 },

  // Attachment inside bubble
  attachmentImage: {
    width: 220, height: 160, borderRadius: 12, marginHorizontal: -4,
  },
  fileCard: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginHorizontal: -4,
  },
  fileCardMine: { backgroundColor: 'rgba(0,0,0,0.12)' },
  fileName: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', textAlign: 'right' },

  // Input area
  inputArea: {
    backgroundColor: 'rgba(10,15,13,0.98)',
    borderTopWidth: 1, borderTopColor: BORDER,
  },

  // Attachment preview strip
  previewBar: {
    flexDirection: 'row-reverse', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  previewImage: {
    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
  },
  previewFileIcon: {
    width: 48, height: 48, borderRadius: 10, flexShrink: 0,
    backgroundColor: 'rgba(0,230,118,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  previewName: {
    flex: 1, fontSize: 13, color: WHITE, textAlign: 'right',
    fontFamily: 'Inter_400Regular',
  },
  previewRemove: { padding: 4, flexShrink: 0 },

  // Input bar row
  inputBar: {
    flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  attachBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: SURFACE, borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  input: {
    flex: 1, backgroundColor: SURFACE, borderRadius: 22,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 14, color: WHITE, maxHeight: 120,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: NEON,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: NEON, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 },
});
