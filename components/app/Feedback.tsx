import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ActivityIndicator, Animated, StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing, Shadows } from '@/constants/spacing';
import { Duration } from '@/constants/motion';
import { Button, EmptyState } from '@/components/ui';
import { TextField } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { ApiError } from '@/lib/api';
import { Sheet } from './Sheet';
import { Txt } from './Txt';

// ── Toast ────────────────────────────────────────────────────────────────────

type ToastState = { id: number; message: string; tone: 'success' | 'error' } | null;
let toastState: ToastState = null;
const toastListeners = new Set<() => void>();

/** A short confirmation that something worked. Errors belong inline, next to the thing that failed. */
export function toast(message: string, tone: 'success' | 'error' = 'success') {
  toastState = { id: Date.now(), message, tone };
  toastListeners.forEach((l) => l());
}

export function ToastHost() {
  const current = useSyncExternalStore(
    (l) => {
      toastListeners.add(l);
      return () => toastListeners.delete(l);
    },
    () => toastState,
    () => toastState,
  );
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<ToastState>(null);

  useEffect(() => {
    if (!current) return;
    setShown(current);
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: Duration.fast, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(opacity, { toValue: 0, duration: Duration.base, useNativeDriver: true }),
    ]).start(() => setShown(null));
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        Shadows.lg,
        { top: insets.top + Spacing.sm, opacity, transform: [{ translateY: opacity.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] },
      ]}
    >
      <Ionicons
        name={shown.tone === 'success' ? 'checkmark-circle' : 'alert-circle'}
        size={20}
        color={shown.tone === 'success' ? Colors.accentMuted : '#FCA5A5'}
      />
      <Txt variant="bodyStrong" color={Colors.white} style={{ flexShrink: 1 }}>
        {shown.message}
      </Txt>
    </Animated.View>
  );
}

// ── Loading & errors ─────────────────────────────────────────────────────────

export function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={Colors.primary} />
    </View>
  );
}

/** A failed load, with the one action that might fix it. */
export function ErrorView({ error, onRetry }: { error?: unknown; onRetry?: () => void }) {
  const { t } = useT();
  const message = error instanceof ApiError && error.code !== 'NETWORK' ? error.message : t('common.errorBody');
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={t('common.errorTitle')}
      subtitle={message}
      actionLabel={onRetry ? t('common.retry') : undefined}
      onAction={onRetry}
    />
  );
}

export function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.code !== 'NETWORK' && error.message ? error.message : fallback;
}

// ── Confirm ──────────────────────────────────────────────────────────────────

/**
 * "Are you sure?" as a sheet, with an optional reason field — for the actions a
 * person would regret: withdrawing, rejecting, cancelling, declining.
 */
export function ConfirmSheet({
  visible,
  onClose,
  title,
  body,
  confirmLabel,
  danger,
  reasonPlaceholder,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  confirmLabel: string;
  danger?: boolean;
  reasonPlaceholder?: string;
  onConfirm: (reason: string) => Promise<unknown> | void;
}) {
  const { t } = useT();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setReason('');
      setError(null);
    }
  }, [visible]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={body}
      footer={
        <View style={{ gap: Spacing.sm }}>
          <Button label={confirmLabel} variant={danger ? 'danger' : 'primary'} fullWidth size="lg" loading={busy} onPress={confirm} />
          <Button label={t('common.keepIt')} variant="ghost" fullWidth onPress={onClose} />
        </View>
      }
    >
      {reasonPlaceholder != null && (
        <TextField value={reason} onChangeText={setReason} placeholder={reasonPlaceholder} multiline maxLength={500} />
      )}
      {error != null && (
        <Txt variant="caption" color={Colors.danger} style={{ marginTop: Spacing.sm }}>
          {error}
        </Txt>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: 480,
    marginHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Spacing.radiusFull,
    zIndex: 1000,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.section },
});
