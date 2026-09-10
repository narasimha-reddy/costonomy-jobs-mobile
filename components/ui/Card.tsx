import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing, Shadows } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';

export type CardPadding = 'none' | 'compact' | 'default' | 'roomy';
export type CardElevation = 'flat' | 'sm' | 'md';

interface CardProps {
  children: React.ReactNode;
  padding?: CardPadding;
  /**
   * `flat` is a bordered card with no shadow — the default for anything that
   * appears in a long list, where a stack of shadows turns into visual mud.
   * Reserve `sm`/`md` for cards that genuinely float: a summary card above a
   * list, a sheet's contents.
   */
  elevation?: CardElevation;
  /** Tints the card and its border — used for the "your next interview" style
   *  callout that has to pull the eye out of an otherwise uniform list. */
  tone?: 'default' | 'accent' | 'primary';
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PADDING: Record<CardPadding, number> = {
  none: 0,
  compact: Spacing.cardPaddingCompact,
  default: Spacing.cardPadding,
  roomy: Spacing.cardPaddingRoomy,
};

const TONES: Record<NonNullable<CardProps['tone']>, { bg: string; border: string }> = {
  default: { bg: Colors.surface, border: Colors.borderLight },
  accent: { bg: Colors.accentLight, border: Colors.accentMuted },
  primary: { bg: Colors.primaryLight, border: Colors.primaryMuted },
};

export function Card({
  children,
  padding = 'default',
  elevation = 'flat',
  tone = 'default',
  onPress,
  style,
  testID,
}: CardProps) {
  const t = TONES[tone];

  const cardStyle: StyleProp<ViewStyle> = [
    styles.base,
    { backgroundColor: t.bg, borderColor: t.border, padding: PADDING[padding] },
    elevation === 'sm' && Shadows.sm,
    elevation === 'md' && Shadows.md,
    style,
  ];

  if (onPress == null) {
    return (
      <View style={cardStyle} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={PRESS_OPACITY}
      accessibilityRole="button"
      style={cardStyle}
      testID={testID}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
  },
});

export default Card;
