import React from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useFontFamily } from '@/hooks/useFontFamily';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  /** `profile_photo_url` / `restaurant.logo_url`. Null is the normal case. */
  uri?: string | null;
  /** Used for the initials fallback. */
  name?: string | null;
  size?: AvatarSize;
  /** A restaurant logo gets a rounded square; a person gets a circle. */
  shape?: 'circle' | 'rounded';
  style?: StyleProp<ViewStyle>;
}

const SIZES: Record<AvatarSize, number> = { sm: 32, md: 44, lg: 64, xl: 88 };

/**
 * Initials, not a generic silhouette, are the fallback.
 *
 * Photo upload is P1 (11-implementation-backlog Epic 6.4) — `profile_photo_url`
 * is null for **every** user through Release 5. So the fallback isn't an edge
 * case here, it is the default rendering of every candidate in every list, and
 * a wall of identical grey silhouettes would make a hiring inbox unscannable.
 * Initials at least differentiate rows.
 */
export function Avatar({ uri, name, size = 'md', shape = 'circle', style }: AvatarProps) {
  const { font } = useFontFamily();
  const dimension = SIZES[size];
  const radius = shape === 'circle' ? dimension / 2 : Spacing.radiusMd;

  const initials = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

  const base: StyleProp<ViewStyle> = [
    styles.base,
    { width: dimension, height: dimension, borderRadius: radius },
    style,
  ];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={base as any}
        accessibilityIgnoresInvertColors
        accessibilityLabel={name ?? undefined}
      />
    );
  }

  return (
    <View style={[base, styles.fallback]} accessibilityLabel={name ?? undefined}>
      {initials ? (
        <Text
          style={[
            styles.initials,
            { fontSize: dimension * 0.38, fontFamily: font('semibold') },
          ]}
        >
          {initials}
        </Text>
      ) : (
        <Ionicons
          name={shape === 'circle' ? 'person' : 'storefront'}
          size={dimension * 0.45}
          color={Colors.textTertiary}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.borderLight,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
});

export default Avatar;
