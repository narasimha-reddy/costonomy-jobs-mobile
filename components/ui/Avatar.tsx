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

  // Words that start with a letter or digit only — "Chai & Tiffin Co." is "CT", not "C&".
  const initials = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter((part) => /^[\p{L}\p{N}]/u.test(part))
    .slice(0, 2)
    .map((part) => Array.from(part)[0]!.toUpperCase())
    .join('');
  const tint = TINTS[hash(name ?? '') % TINTS.length]!;

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
    <View style={[base, styles.fallback, initials ? { backgroundColor: tint.bg } : null]} accessibilityLabel={name ?? undefined}>
      {initials ? (
        <Text
          style={[
            styles.initials,
            { fontSize: dimension * 0.38, fontFamily: font('semibold'), color: tint.fg },
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

/**
 * Soft tints, picked by a stable hash of the name, so a list of initials is
 * scannable by colour as well as by letter. Same name, same colour, every time.
 */
const TINTS = [
  { bg: Colors.primaryLight, fg: Colors.primaryDark },
  { bg: Colors.accentLight, fg: Colors.accentDark },
  { bg: '#EFF6FF', fg: '#1D4ED8' },
  { bg: '#F5F3FF', fg: '#6D28D9' },
  { bg: '#FFFBEB', fg: '#B45309' },
  { bg: '#FDF2F8', fg: '#BE185D' },
];

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
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
