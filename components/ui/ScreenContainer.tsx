import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { useResponsive } from '@/hooks/useResponsive';

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Override the size-class default (720 medium / 900 expanded). */
  maxWidth?: number;
  /** Applies the size class's horizontal gutter. Off when the child is a
   *  FlatList that needs to bleed to the edges and pad its own content. */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Caps and centres a content column on tablet, and renders **nothing** on a
 * phone — the compact branch returns children bare, so no extra view enters the
 * tree and phone layout is provably unchanged.
 *
 * Same idea as `ResponsiveContainer` in `costonomy-mobile-app`, with the gutter
 * folded in so a screen doesn't have to reach for `useResponsive` just to pad
 * itself correctly.
 */
export function ScreenContainer({
  children,
  maxWidth,
  padded = false,
  style,
}: ScreenContainerProps) {
  const { isTablet, contentMaxWidth, gutter } = useResponsive();

  if (!isTablet && !padded) return <>{children}</>;

  return (
    <View
      style={[
        styles.fill,
        isTablet && styles.centered,
        isTablet && { maxWidth: maxWidth ?? contentMaxWidth ?? undefined },
        padded && { paddingHorizontal: gutter },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.background },
  centered: { width: '100%', alignSelf: 'center' },
});

export default ScreenContainer;
