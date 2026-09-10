import React, { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Duration, Ease } from '@/constants/motion';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The loading primitive. A list or detail view that has no cached content shows
 * these, never a full-screen blocking spinner (05-mobile-screens §6) — a
 * skeleton tells you what is about to arrive and how much of it, which on a slow
 * connection is the difference between waiting and giving up.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = Spacing.radiusSm,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: Duration.skeletonPulse, easing: Ease.inOut }),
      -1,
      true,
    );
  }, [opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: Colors.border }, animated, style]}
    />
  );
}

/** The shape of a job card in the feed, and of a candidate card in search. */
export function SkeletonCard({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={44} height={44} borderRadius={Spacing.radiusMd} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="45%" height={12} />
        </View>
      </View>
      <Skeleton width="55%" height={12} />
      <View style={styles.cardChips}>
        <Skeleton width={72} height={24} borderRadius={Spacing.radiusFull} />
        <Skeleton width={96} height={24} borderRadius={Spacing.radiusFull} />
      </View>
    </View>
  );
}

export function SkeletonList({ rows = 4, style }: { rows?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.list, style]}>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.cardPadding,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    gap: Spacing.sm,
  },
  cardChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.screenHorizontal,
    gap: Spacing.md,
  },
});

export default Skeleton;
