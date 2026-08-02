import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import colors from '@/constants/colors';
import { authApi, notificationApi, ApiError } from '@/services/api';

const { light, government } = colors;

const GREEN_DARK = government.navyDark;
const GREEN_MID  = government.navy;
const GOLD       = government.gold;
const CREAM      = light.background;
const WHITE      = light.card;
const TEXT       = light.text;
const MUTED      = light.mutedForeground;
const BORDER     = light.border;

const STEP_DEFINITIONS = [
  { label: 'Registration submitted', labelAr: 'تم تقديم الطلب' },
  { label: 'OTP verified',           labelAr: 'تم التحقق من الرمز' },
  { label: 'Pending admin review',   labelAr: 'في انتظار مراجعة المسؤول' },
  { label: 'Account activation',     labelAr: 'تفعيل الحساب' },
];

// Backend emits exactly three status values (Employee.Status enum):
//   PENDING_VERIFICATION — registered, OTP not yet verified
//   PENDING_APPROVAL     — OTP verified, awaiting admin activation
//   ACTIVE               — fully activated
/** Map API status → how many of the four steps are complete. */
function completedSteps(status: string): number {
  switch (status?.toUpperCase()) {
    case 'PENDING_VERIFICATION': return 1; // registration submitted only
    case 'PENDING_APPROVAL':     return 2; // + OTP verified
    case 'ACTIVE':               return 4; // all four steps done
    default:                     return 1; // safe fallback
  }
}

const POLL_INTERVAL_MS = 30_000; // 30 seconds

/** Navigate to login immediately with haptic feedback and an alert. */
function navigateToLogin() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  Alert.alert(
    '✅ Account Approved! — تم قبول حسابك',
    'Your account has been approved. Please sign in.',
    [{ text: 'Sign In', onPress: () => router.replace('/(auth)/login') }],
    { cancelable: false }
  );
}

export default function WaitingScreen() {
  const insets = useSafeAreaInsets();
  const topPad    = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const { nationalId } = useLocalSearchParams<{ nationalId?: string }>();

  const [status, setStatus] = useState<string>('PENDING_VERIFICATION');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Guard against navigating twice (poll + notification arriving simultaneously)
  const navigatedRef = useRef(false);

  const clearPoll = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleApproval = useCallback(() => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    clearPoll();
    navigateToLogin();
  }, []);

  const fetchStatus = useCallback(async (silent = false) => {
    if (!nationalId) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await authApi.getStatus(nationalId);
      const newStatus = res.data?.status ?? 'PENDING_VERIFICATION';
      setStatus(newStatus);

      if (newStatus.toUpperCase() === 'ACTIVE') {
        handleApproval();
      } else if (newStatus.toUpperCase() === 'REJECTED') {
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          clearPoll();
          Alert.alert(
            'Registration Rejected — تم رفض الطلب',
            'Your registration was rejected. Please contact your HR administrator.',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
        }
      }
    } catch (err) {
      if (!silent) {
        const msg = err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.';
        setError(msg);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [nationalId, handleApproval]);

  // Initial fetch + 30-second auto-poll (silent background polls)
  useEffect(() => {
    if (!nationalId) return;
    fetchStatus(true);
    intervalRef.current = setInterval(() => fetchStatus(true), POLL_INTERVAL_MS);
    return clearPoll;
  }, [fetchStatus, nationalId]);

  // ── Push notification registration ────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web' || !Device.isDevice || !nationalId) return;

    let cancelled = false;

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await Notifications.getPermissionsAsync() as any;
        let granted: boolean = Boolean(existing?.granted);

        if (!granted) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const requested = await Notifications.requestPermissionsAsync() as any;
          granted = Boolean(requested?.granted);
        }

        if (!granted || cancelled) return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        const platform  = Platform.OS === 'ios' ? 'ios' : 'android';

        // Non-fatal — token registration failing doesn't break polling fallback
        await notificationApi.registerPendingToken(nationalId, tokenData.data, platform);
      } catch {
        // Silently degrade; polling is still active as fallback
      }
    })();

    return () => { cancelled = true; };
  }, [nationalId]);

  // ── Foreground notification listener ─────────────────────────────────────
  useEffect(() => {
    // Listen for notifications while the app is foregrounded on this screen
    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as Record<string, unknown> | null;
      // Backend sends lowercase "account_approved" — compare case-insensitively
      if (String(data?.type ?? '').toUpperCase() === 'ACCOUNT_APPROVED') {
        handleApproval();
      }
    });

    // Also handle the user tapping a notification that arrives while backgrounded
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      if (String(data?.type ?? '').toUpperCase() === 'ACCOUNT_APPROVED') {
        handleApproval();
      }
    });

    return () => {
      foregroundSub.remove();
      responseSub.remove();
    };
  }, [handleApproval]);

  // Step state derivation
  const doneCount  = completedSteps(status);
  // The "current" step is the first incomplete one; -1 when all are done.
  const currentIdx = doneCount < STEP_DEFINITIONS.length ? doneCount : -1;

  return (
    <View style={[styles.container, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      {/* Status illustration */}
      <View style={styles.illustrationArea}>
        <View style={styles.outerRing}>
          <View style={styles.innerCircle}>
            <Ionicons name="hourglass-outline" size={48} color={GOLD} />
          </View>
        </View>
      </View>

      {/* Heading */}
      <Text style={styles.title}>Application Received</Text>
      <Text style={styles.titleAr}>تم استلام طلبك</Text>
      <Text style={styles.description}>
        Your registration is under review by our administrators.
        You will receive a notification once your account is approved.
        {'\n\n'}
        طلبك قيد المراجعة من قِبل المسؤولين.
        ستتلقى إشعاراً عند الموافقة على حسابك.
      </Text>

      {/* Progress steps — white card */}
      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>Registration Progress — تقدم التسجيل</Text>
        <View style={styles.steps}>
          {STEP_DEFINITIONS.map((step, i) => {
            const isCompleted = i < doneCount;
            const isCurrent   = i === currentIdx;
            return (
              <View key={i} style={styles.stepRow}>
                <Ionicons
                  name={
                    isCompleted ? 'checkmark-circle'
                    : isCurrent  ? 'time'
                    :              'ellipse-outline'
                  }
                  size={20}
                  color={isCompleted ? light.success : isCurrent ? GOLD : MUTED}
                />
                <View style={styles.stepLabels}>
                  <Text style={[styles.stepLabel, !isCompleted && styles.stepLabelPending]}>
                    {step.label}
                  </Text>
                  <Text style={styles.stepLabelAr}>{step.labelAr}</Text>
                </View>
                {i < STEP_DEFINITIONS.length - 1 && (
                  <View style={[styles.connector, isCompleted && styles.connectorDone]} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* Inline error */}
      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color={light.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={styles.pollNotice}>
          <Ionicons name="sync-outline" size={13} color={MUTED} />
          <Text style={styles.pollNoticeText}>
            {'  '}Checking for updates every 30 seconds · يتحقق كل 30 ثانية
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.checkStatusBtn, loading && styles.btnDisabled]}
          onPress={() => fetchStatus(false)}
          disabled={loading}
          activeOpacity={0.82}
        >
          {loading ? (
            <ActivityIndicator size="small" color={GREEN_MID} />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={GREEN_MID} />
          )}
          <Text style={styles.checkStatusText}>
            {loading ? 'Checking…' : 'Check Status — تحقق من الحالة'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/')}
          activeOpacity={0.82}
        >
          <Text style={styles.backBtnText}>Back to Welcome — العودة للبداية</Text>
        </TouchableOpacity>
      </View>

      {/* Support note */}
      <Text style={styles.supportNote}>
        Need help? Contact your HR administrator.{'\n'}
        تحتاج مساعدة؟ تواصل مع مسؤول الموارد البشرية.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  illustrationArea: {
    marginTop: 24,
  },
  outerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(13,107,63,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: GREEN_MID,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: TEXT,
    textAlign: 'center',
  },
  titleAr: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
    textAlign: 'center',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  stepsCard: {
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 18,
    width: '100%',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  stepsTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: GREEN_MID,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 14,
  },
  steps: {
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepLabels: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: TEXT,
  },
  stepLabelPending: {
    color: MUTED,
    fontFamily: 'Inter_400Regular',
  },
  stepLabelAr: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
  },
  connector: {
    position: 'absolute',
    left: 9,
    top: 22,
    width: 2,
    height: 14,
    backgroundColor: BORDER,
  },
  connectorDone: {
    backgroundColor: light.success,
  },
  pollNotice: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollNoticeText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: light.destructive,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: WHITE,
    shadowColor: GREEN_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  checkStatusText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: GREEN_MID,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
  },
  supportNote: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: MUTED,
    textAlign: 'center',
    lineHeight: 18,
  },
});
