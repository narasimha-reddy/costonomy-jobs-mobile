import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WEB_FRAME_WIDTH } from '@/constants/breakpoints';
import { Colors } from '@/constants/colors';

/**
 * In a browser, the app sits in a centred phone-width column on a grey page —
 * the same frame costonomy-mobile-app uses — so the web build looks and behaves
 * like the phone app it previews. Native renders children untouched.
 */
export function WebFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={styles.page}>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, alignItems: 'center', backgroundColor: '#E5E7EB' },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_FRAME_WIDTH,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#D1D5DB',
  },
});
