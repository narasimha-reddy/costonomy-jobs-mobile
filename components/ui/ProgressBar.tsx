import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useFontFamily } from '@/hooks/useFontFamily';

interface ProgressBarProps {
  /** 0–100. Clamped, so an out-of-range server value can't overflow the track. */
  value: number;
  label?: string;
  /** Renders the percentage on the right of the label row. */
  showValue?: boolean;
  /**
   * Below this, the bar turns amber to signal "not enough yet" — used for the
   * profile-completion floor that gates applying
   * (`app_config['application.min_profile_completion']`, default 40).
   */
  threshold?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Profile completion, and any other 0–100 progress.
 *
 * Amber below the threshold, accent teal above it, green at 100. It is
 * deliberately *not* red below the threshold: an incomplete profile is a
 * to-do, not an error, and Appendix B of the PRD warns specifically against
 * onboarding that feels punishing enough to abandon.
 */
export function ProgressBar({
  value,
  label,
  showValue = true,
  threshold,
  style,
}: ProgressBarProps) {
  const { font } = useFontFamily();
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  const fill =
    clamped >= 100
      ? Colors.success
      : threshold != null && clamped < threshold
        ? Colors.warning
        : Colors.accent;

  return (
    <View style={style}>
      {(label != null || showValue) && (
        <View style={styles.labelRow}>
          {label != null && (
            <Text style={[styles.label, { fontFamily: font('medium') }]}>{label}</Text>
          )}
          {showValue && (
            <Text style={[styles.value, { color: fill, fontFamily: font('bold') }]}>
              {clamped}%
            </Text>
          )}
        </View>
      )}
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: clamped }}
        accessibilityLabel={label}
      >
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: fill }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: FontSize.sm,
  },
  track: {
    height: 8,
    borderRadius: Spacing.radiusFull,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Spacing.radiusFull,
  },
});

export default ProgressBar;
