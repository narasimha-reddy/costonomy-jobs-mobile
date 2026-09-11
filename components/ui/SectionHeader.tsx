import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { FontSize } from '@/constants/typography';
import { Spacing, Touch } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { useFontFamily } from '@/hooks/useFontFamily';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  /** A count badge — "12 candidates". */
  count?: number;
  /** A trailing text action: "See all", "Edit". */
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Divides a scroll view into named regions — "Recommended for you", "Nearby". */
export function SectionHeader({
  title,
  subtitle,
  count,
  actionLabel,
  onAction,
  style,
}: SectionHeaderProps) {
  const { font } = useFontFamily();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.textBlock}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { fontFamily: font('bold') }]}>{title}</Text>
          {count != null && (
            <View style={styles.countPill}>
              <Text style={[styles.countText, { fontFamily: font('semibold') }]}>{count}</Text>
            </View>
          )}
        </View>
        {subtitle != null && (
          <Text style={[styles.subtitle, { fontFamily: font('regular') }]}>{subtitle}</Text>
        )}
      </View>

      {actionLabel != null && onAction != null && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={PRESS_OPACITY}
          hitSlop={Touch.hitSlop}
          accessibilityRole="button"
          style={styles.action}
        >
          <Text style={[styles.actionLabel, { fontFamily: font('semibold') }]}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={15} color={Colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  countPill: {
    minWidth: 22,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Spacing.radiusFull,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
  },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingTop: 2,
  },
  actionLabel: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
});

export default SectionHeader;
