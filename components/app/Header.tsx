import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Spacing, Touch } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { useResponsive } from '@/hooks/useResponsive';
import { Txt } from './Txt';

interface HeaderProps {
  title?: string;
  /** Hide the back button — the first screen of a flow. */
  noBack?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
  /** Close (×) instead of back, for screens presented as a modal task. */
  close?: boolean;
}

/** The compact bar on pushed screens: back, an optional centred title, one action. */
export function Header({ title, noBack, onBack, right, close }: HeaderProps) {
  const { gutter } = useResponsive();
  const back = () => (onBack ? onBack() : router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <View style={[styles.bar, { paddingHorizontal: gutter - Spacing.sm }]}>
      <View style={styles.side}>
        {!noBack && (
          <IconButton icon={close ? 'close' : 'chevron-back'} onPress={back} label="Back" />
        )}
      </View>
      <Txt variant="subheading" numberOfLines={1} style={styles.title} align="center">
        {title ?? ''}
      </Txt>
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  color = Colors.textPrimary,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  color?: string;
  badge?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={PRESS_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.iconButton}
    >
      <Ionicons name={icon} size={24} color={color} />
      {badge && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

/**
 * The big title at the top of a tab screen. Large, left-aligned, and scrolls with
 * the content — the modern pattern, and the one that leaves room for a Hindi title
 * running 40% longer than its English source.
 */
export function LargeTitle({
  title,
  subtitle,
  eyebrow,
  right,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.large}>
      <View style={{ flex: 1 }}>
        {eyebrow != null && (
          <Txt variant="captionStrong" color={Colors.textSecondary} style={{ marginBottom: 2 }}>
            {eyebrow}
          </Txt>
        )}
        <Txt variant="display">{title}</Txt>
        {subtitle != null && (
          <Txt variant="caption" color={Colors.textSecondary} style={{ marginTop: 4 }}>
            {subtitle}
          </Txt>
        )}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: { width: 88, flexDirection: 'row', alignItems: 'center' },
  right: { justifyContent: 'flex-end' },
  title: { flex: 1 },
  iconButton: {
    width: Touch.min,
    height: Touch.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  large: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
