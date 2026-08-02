/**
 * Admin — Notification Inbox
 * Shows push notifications received on this device, stored locally via AsyncStorage.
 * A listener saves incoming notifications automatically while the app is open.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
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

const STORAGE_KEY = '@asa_notification_log';
const MAX_STORED  = 100;

interface StoredNotification {
  id:        string;
  title:     string;
  body:      string;
  receivedAt:string;
  data?:     Record<string, unknown>;
}

async function loadNotifications(): Promise<StoredNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveNotification(n: StoredNotification): Promise<void> {
  const existing = await loadNotifications();
  const updated  = [n, ...existing].slice(0, MAX_STORED);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

async function clearNotifications(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins   = Math.floor(diffMs / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsScreen() {
  const [items, setItems]       = useState<StoredNotification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    setItems(await loadNotifications());
  }, []);

  useEffect(() => {
    reload();

    // Listen for notifications received while screen is mounted
    const sub = Notifications.addNotificationReceivedListener(async (notification) => {
      const n: StoredNotification = {
        id:         notification.request.identifier,
        title:      notification.request.content.title ?? 'Notification',
        body:       notification.request.content.body  ?? '',
        receivedAt: new Date().toISOString(),
        data:       (notification.request.content.data as Record<string, unknown>) ?? {},
      };
      await saveNotification(n);
      setItems(prev => [n, ...prev].slice(0, MAX_STORED));
    });

    return () => sub.remove();
  }, [reload]);

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  const confirmClear = () => {
    Alert.alert('Clear All', 'Delete all stored notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All', style: 'destructive',
        onPress: async () => {
          await clearNotifications();
          setItems([]);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: StoredNotification; index: number }) => {
    // First item treated as "unread" with green dot
    const isUnread = index === 0;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {/* Green dot for unread */}
          {isUnread && <View style={styles.unreadDot} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
          </View>
          <Text style={styles.timeAgo}>{timeAgo(item.receivedAt)}</Text>
        </View>
        {item.data && Object.keys(item.data).length > 0 && (
          <Text style={styles.cardData}>
            {Object.entries(item.data)
              .map(([k, v]) => `${k}: ${v}`)
              .join('  ·  ')}
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
          <Text style={styles.title}>Notifications</Text>
          <Text style={styles.titleAr}>الإشعارات</Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={confirmClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cream bg list */}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GREEN_MID} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyBody}>
              Notifications you receive while the app is open will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: CREAM },

  // Header — navyDark
  header:     { flexDirection: 'row', alignItems: 'center', gap: 12,
                padding: 16, paddingBottom: 14, backgroundColor: GREEN_DARK },
  backBtn:    { padding: 4 },
  backText:   { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontFamily: 'Inter_500Medium' },
  title:      { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#fff' },
  titleAr:    { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)' },
  clearBtn:   { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 10,
                paddingHorizontal: 10, paddingVertical: 6 },
  clearBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },

  list:       { padding: 16, paddingBottom: 60, gap: 10 },

  // White cards per notification with green unread dot
  card:       { backgroundColor: WHITE, borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: BORDER,
                shadowColor: GREEN_DARK, shadowOpacity: 0.10, shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },

  // Green dot for unread
  unreadDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN_MID,
                marginTop: 4, flexShrink: 0 },

  cardTitle:  { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: TEXT, marginBottom: 4 },
  cardBody:   { fontSize: 14, fontFamily: 'Inter_400Regular', color: MUTED, lineHeight: 20 },
  timeAgo:    { fontSize: 11, fontFamily: 'Inter_400Regular', color: MUTED, minWidth: 60, textAlign: 'right', marginTop: 2 },
  cardData:   { fontSize: 11, fontFamily: 'Inter_400Regular', color: MUTED,
                backgroundColor: CREAM, borderRadius: 8,
                padding: 8, marginTop: 10 },

  empty:      { alignItems: 'center', paddingTop: 80 },
  emptyIcon:  { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', color: MUTED, marginBottom: 8 },
  emptyBody:  { fontSize: 14, fontFamily: 'Inter_400Regular', color: MUTED, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32 },
});
