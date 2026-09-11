import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { FontSize } from '@/constants/typography';
import { Spacing, Touch } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { useFontFamily } from '@/hooks/useFontFamily';

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * `primary` is Costonomy orange and there is **at most one per screen** — the
 * thing you came to that screen to do. `accent` (teal) is the second-most
 * important action and the one that moves a candidate along a pipeline;
 * `secondary` is a bordered neutral for "the other option"; `ghost` is for
 * actions that live inside a row or header; `danger` for destructive confirms.
 */
export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon. Ionicons only — see docs/design-system.md §Icons. */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Trailing icon, for "continue"-shaped actions. */
  iconRight?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  /** Stretch to the container's width. Default for a screen's primary CTA. */
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

// ─── Variant config ──────────────────────────────────────────────────────────

const VARIANTS: Record<
  ButtonVariant,
  { bg: string; fg: string; border: string | null }
> = {
  primary: { bg: Colors.primary, fg: Colors.textInverse, border: null },
  accent: { bg: Colors.accent, fg: Colors.textInverse, border: null },
  secondary: { bg: Colors.surface, fg: Colors.textPrimary, border: Colors.border },
  ghost: { bg: 'transparent', fg: Colors.primary, border: null },
  danger: { bg: Colors.danger, fg: Colors.textInverse, border: null },
};

const SIZES: Record<ButtonSize, { height: number; padH: number; font: number; icon: number }> = {
  sm: { height: Touch.buttonHeightSm, padH: Spacing.lg, font: FontSize.sm, icon: 16 },
  md: { height: Touch.buttonHeightMd, padH: Spacing.xxl, font: FontSize.base, icon: 18 },
  lg: { height: Touch.buttonHeightLg, padH: Spacing.xxl, font: FontSize.md, icon: 20 },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { font } = useFontFamily();
  const v = VARIANTS[variant];
  const s = SIZES[size];

  // A loading button stays visually enabled but is not pressable. Greying it out
  // mid-submit reads as "it failed"; keeping it lit with a spinner reads as
  // "it's working", which is what actually happened.
  const inert = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={inert}
      activeOpacity={PRESS_OPACITY}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inert, busy: loading }}
      testID={testID}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          minHeight: s.height,
          paddingHorizontal: s.padH,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border ?? undefined,
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <View style={styles.content}>
          {icon != null && <Ionicons name={icon} size={s.icon} color={v.fg} />}
          {/* `numberOfLines={1}` is wrong here: Hindi labels run 20–40% longer
              than their English source (07-localization §5) and a two-line
              button is far better than a truncated verb. The row wraps, the
              button grows — which is why the height above is a `minHeight`. */}
          <Text
            style={[styles.label, { color: v.fg, fontSize: s.font, fontFamily: font('semibold') }]}
          >
            {label}
          </Text>
          {iconRight != null && <Ionicons name={iconRight} size={s.icon} color={v.fg} />}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.radiusFull,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  label: {
    textAlign: 'center',
    letterSpacing: 0.1,
  },
});

export default Button;
