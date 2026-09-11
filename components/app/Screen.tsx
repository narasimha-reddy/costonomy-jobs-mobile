import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { useResponsive } from '@/hooks/useResponsive';

interface ScreenProps {
  children: React.ReactNode;
  /** `plain` is white, for forms and details; `tinted` is the grey behind lists of cards. */
  tone?: 'plain' | 'tinted';
  scroll?: boolean;
  /** A bar pinned above the home indicator: the screen's primary action. */
  footer?: React.ReactNode;
  header?: React.ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Tab screens: the tab bar already clears the bottom inset. */
  edges?: ('top' | 'bottom')[];
}

/**
 * The frame every screen sits in: safe area, background, optional scroll with
 * pull-to-refresh, a pinned footer, and keyboard avoidance so a focused field is
 * never hidden behind the keyboard on a small phone.
 */
export function Screen({
  children,
  tone = 'plain',
  scroll = true,
  footer,
  header,
  refreshing,
  onRefresh,
  padded = true,
  contentStyle,
  edges = ['top'],
}: ScreenProps) {
  const { contentMaxWidth, gutter } = useResponsive();
  const insets = useSafeAreaInsets();
  const background = tone === 'tinted' ? Colors.background : Colors.surface;

  const inner: StyleProp<ViewStyle> = [
    padded && { paddingHorizontal: gutter },
    contentMaxWidth != null && { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' },
    contentStyle,
  ];

  return (
    <SafeAreaView edges={edges} style={[styles.fill, { backgroundColor: background }]}>
      {header}
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView
            style={styles.fill}
            contentContainerStyle={[inner, { paddingBottom: footer ? Spacing.xl : Spacing.section }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.fill, inner]}>{children}</View>
        )}
        {footer != null && (
          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, Spacing.md), backgroundColor: background },
            ]}
          >
            <View style={[{ paddingHorizontal: gutter }, contentMaxWidth != null && { maxWidth: contentMaxWidth, width: '100%', alignSelf: 'center' }]}>
              {footer}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  footer: {
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
