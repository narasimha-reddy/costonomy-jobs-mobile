import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, type StatusToken } from '@/constants/colors';
import { FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useFontFamily } from '@/hooks/useFontFamily';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'neutral';
export type StatusBadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
  /** The visible label. **Always** pass one — see the note on colour below. */
  label: string;
  /** A named semantic variant, for generic use. */
  variant?: StatusBadgeVariant;
  /**
   * A domain status token from `constants/colors` (`ApplicationStatusColors`
   * et al). Takes precedence over `variant`. This is how the pipeline badges
   * stay in sync with the state machines in one place.
   */
  token?: StatusToken;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: StatusBadgeSize;
  /**
   * Fills the badge with `fg` and inverts the label. Reserved for a *terminal
   * success* — JOINED, and nothing else — so that the one state the whole
   * product exists to produce is the one badge that reads as solid.
   */
  solid?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<StatusBadgeVariant, StatusToken & { icon: keyof typeof Ionicons.glyphMap }> = {
  success: { fg: Colors.success, bg: Colors.successLight, icon: 'checkmark-circle' },
  warning: { fg: Colors.warning, bg: Colors.warningLight, icon: 'alert-circle' },
  danger: { fg: Colors.danger, bg: Colors.dangerLight, icon: 'close-circle' },
  info: { fg: Colors.info, bg: Colors.infoLight, icon: 'information-circle' },
  accent: { fg: Colors.accent, bg: Colors.accentLight, icon: 'ellipse' },
  neutral: { fg: Colors.textSecondary, bg: Colors.borderLight, icon: 'ellipse' },
};

/**
 * A pill carrying one piece of state.
 *
 * **The label is not optional.** Colour alone can't carry a status: roughly 1 in
 * 12 men has a colour-vision deficiency, a screen reader gets nothing from a
 * background colour, and the SHORTLISTED/INTERVIEW/SELECTED band of the
 * application ramp is deliberately adjacent in hue. The label is the signal;
 * the colour is reinforcement.
 */
export function StatusBadge({
  label,
  variant = 'neutral',
  token,
  icon,
  size = 'md',
  solid = false,
  style,
}: StatusBadgeProps) {
  const { font } = useFontFamily();
  const v = VARIANTS[variant];
  const colors = token ?? v;
  const resolvedIcon = icon ?? v.icon;

  const bg = solid ? colors.fg : colors.bg;
  const fg = solid ? Colors.textInverse : colors.fg;
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        { backgroundColor: bg },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Ionicons name={resolvedIcon} size={iconSize} color={fg} />
      <Text
        style={[
          styles.label,
          {
            color: fg,
            fontFamily: font('semibold'),
            fontSize: size === 'sm' ? FontSize.xs : FontSize.xs,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.radiusFull,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
  },
  badgeMd: {
    paddingVertical: Spacing.xs + 1,
    paddingHorizontal: Spacing.sm + 2,
  },
  label: {
    letterSpacing: 0.2,
  },
});

export default StatusBadge;
