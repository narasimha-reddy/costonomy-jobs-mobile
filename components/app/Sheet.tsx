import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing, Shadows } from '@/constants/spacing';
import { Duration } from '@/constants/motion';
import { SHEET_MAX_WIDTH_TABLET, WEB_FRAME_WIDTH } from '@/constants/breakpoints';
import { useResponsive } from '@/hooks/useResponsive';
import { Txt } from './Txt';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Pinned under the scrolling content: the sheet's action. */
  footer?: React.ReactNode;
  /** Let long content (a role list) take most of the screen. */
  tall?: boolean;
}

/**
 * A bottom sheet. Built on `Modal` rather than a gesture library, because it only
 * has to open, scroll and close — and the fewer native dependencies the app has,
 * the longer it keeps running in Expo Go.
 */
export function Sheet({ visible, onClose, title, subtitle, children, footer, tall }: SheetProps) {
  const insets = useSafeAreaInsets();
  const { isTablet, height } = useResponsive();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, { toValue: 1, duration: Duration.base, useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(progress, { toValue: 0, duration: Duration.fast, useNativeDriver: true }).start(() =>
        setMounted(false),
      );
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!mounted) return null;

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [400, 0] });

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            Shadows.sheet,
            {
              transform: [{ translateY }],
              maxHeight: height * (tall ? 0.9 : 0.85),
              paddingBottom: footer ? 0 : Math.max(insets.bottom, Spacing.lg),
            },
            isTablet && { maxWidth: SHEET_MAX_WIDTH_TABLET, alignSelf: 'center', width: '100%' },
            // A Modal renders over the whole browser window; keep the sheet in the phone column.
            Platform.OS === 'web' && { maxWidth: WEB_FRAME_WIDTH, marginHorizontal: 'auto' },
            tall && { height: height * 0.9 },
          ]}
        >
          <View style={styles.handle} />
          {(title || subtitle) && (
            <View style={styles.head}>
              {title != null && <Txt variant="heading">{title}</Txt>}
              {subtitle != null && (
                <Txt variant="caption" color={Colors.textSecondary} style={{ marginTop: 4 }}>
                  {subtitle}
                </Txt>
              )}
            </View>
          )}
          <ScrollView
            style={tall ? styles.fill : undefined}
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer != null && (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>{footer}</View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scrim: { backgroundColor: Colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Spacing.radiusXl + 4,
    borderTopRightRadius: Spacing.radiusXl + 4,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  head: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  body: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
});
