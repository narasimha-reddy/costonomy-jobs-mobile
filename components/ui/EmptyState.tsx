import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useFontFamily } from '@/hooks/useFontFamily';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  /** Say *why* it's empty. "No jobs yet" is not a reason; "…in Hyderabad" is. */
  subtitle?: string;
  /** The one thing the user can do about it. */
  actionLabel?: string;
  onAction?: () => void;
  /** A second, lower-commitment way out. */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * An empty state always explains *why* it's empty and offers one specific next
 * action (05-mobile-screens §6). "No data" with a shrug is banned — the
 * canonical case here is an employee whose city has no matching jobs yet, where
 * the honest response is "widen your preferred locations", routed straight to
 * the screen that does it, not a dead end.
 */
export function EmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  style,
}: EmptyStateProps) {
  const { font, lineHeight } = useFontFamily();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={38} color={Colors.textTertiary} />
      </View>

      <Text style={[styles.title, { fontFamily: font('bold') }]}>{title}</Text>

      {subtitle != null && (
        <Text
          style={[
            styles.subtitle,
            { fontFamily: font('regular'), lineHeight: lineHeight(FontSize.base, 'relaxed') },
          ]}
        >
          {subtitle}
        </Text>
      )}

      {actionLabel != null && onAction != null && (
        <Button label={actionLabel} onPress={onAction} variant="primary" iconRight="arrow-forward" />
      )}

      {secondaryActionLabel != null && onSecondaryAction != null && (
        <Button
          label={secondaryActionLabel}
          onPress={onSecondaryAction}
          variant="ghost"
          size="sm"
          style={styles.secondary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingVertical: Spacing.section,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.md,
  },
  secondary: {
    marginTop: Spacing.sm,
    alignSelf: 'center',
  },
});

export default EmptyState;
