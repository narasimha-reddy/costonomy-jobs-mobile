import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Duration } from '@/constants/motion';
import { useT } from '@/lib/i18n';
import { useIsOffline } from '@/lib/network';
import { Txt } from './Txt';

/**
 * One app-wide line when there is no connection, instead of every screen failing
 * in its own way. What is already on screen stays usable; nothing new loads until
 * the connection returns, and then it refreshes by itself.
 */
export function OfflineBanner() {
  const { t } = useT();
  const offline = useIsOffline();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, { toValue: offline ? 1 : 0, duration: Duration.base, useNativeDriver: true }).start();
  }, [offline, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      accessibilityElementsHidden={!offline}
      style={[
        styles.banner,
        {
          top: insets.top + Spacing.sm,
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        },
      ]}
    >
      <Ionicons name="cloud-offline-outline" size={16} color={Colors.white} />
      <Txt variant="captionStrong" color={Colors.white}>
        {t('common.offline')}
      </Txt>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.textPrimary,
  },
});
