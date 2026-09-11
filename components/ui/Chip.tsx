import React from 'react';
import {
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

interface ChipProps {
  label: string;
  /** Selected chips use the accent, not the primary — a filter is not a CTA. */
  selected?: boolean;
  onPress?: () => void;
  /** Shows an × and calls `onRemove`. For applied-filter and skill-tag chips. */
  onRemove?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  /** A trailing count, e.g. the number of results behind a filter. */
  count?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The filter/tag primitive. Used for the JobFeed filter row, JobSearch and
 * CandidateSearch filter vocabulary, and skill/cuisine tags on a profile.
 *
 * Employee-side and restaurant-side search deliberately share this component
 * *and* its filter vocabulary (05-mobile-screens §5) — a candidate and a hiring
 * manager filtering on "Commis 1" should be looking at the same control.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
  count,
  disabled = false,
  style,
  testID,
}: ChipProps) {
  const { font } = useFontFamily();

  const fg = selected ? Colors.accentDark : Colors.textSecondary;
  const bg = selected ? Colors.accentLight : Colors.surface;
  const border = selected ? Colors.accent : Colors.border;

  const body = (
    <>
      {icon != null && <Ionicons name={icon} size={14} color={fg} />}
      <Text style={[styles.label, { color: fg, fontFamily: font(selected ? 'semibold' : 'medium') }]}>
        {label}
      </Text>
      {count != null && (
        <View style={[styles.count, { backgroundColor: selected ? Colors.accent : Colors.borderLight }]}>
          <Text
            style={[
              styles.countText,
              { color: selected ? Colors.textInverse : Colors.textSecondary, fontFamily: font('semibold') },
            ]}
          >
            {count}
          </Text>
        </View>
      )}
    </>
  );

  // A sibling of the press target, never a child: nested pressables are invalid
  // (<button> in <button>) on web and ambiguous to screen readers everywhere.
  const remove = onRemove != null && (
    <TouchableOpacity
      onPress={onRemove}
      hitSlop={Touch.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={`Remove ${label}`}
    >
      <Ionicons name="close" size={15} color={fg} />
    </TouchableOpacity>
  );

  const containerStyle: StyleProp<ViewStyle> = [
    styles.chip,
    { backgroundColor: bg, borderColor: border },
    disabled && styles.disabled,
    style,
  ];

  if (onPress == null) {
    return (
      <View style={containerStyle} testID={testID}>
        {body}
        {remove}
      </View>
    );
  }

  if (remove) {
    return (
      <View style={containerStyle} testID={testID}>
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          activeOpacity={PRESS_OPACITY}
          accessibilityRole="button"
          accessibilityState={{ selected, disabled }}
          accessibilityLabel={label}
          style={styles.pressArea}
        >
          {body}
        </TouchableOpacity>
        {remove}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={PRESS_OPACITY}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      accessibilityLabel={label}
      style={containerStyle}
      testID={testID}
    >
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    // 36 rather than the 48pt floor: a chip is never the only way to reach an
    // action, it sits in a horizontally scrolling row where a 48pt height would
    // eat the feed, and it is padded generously on the horizontal axis where
    // the thumb actually travels.
    minHeight: 36,
    paddingVertical: Spacing.sm - 2,
    paddingHorizontal: Spacing.md + 2,
    borderRadius: Spacing.radiusFull,
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.4,
  },
  pressArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  label: {
    fontSize: FontSize.sm,
  },
  count: {
    minWidth: 20,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Spacing.radiusFull,
    alignItems: 'center',
  },
  countText: {
    fontSize: FontSize.xs,
  },
});

export default Chip;
