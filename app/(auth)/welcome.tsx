import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Txt } from '@/components/app/Txt';
import { OptionCard } from '@/components/app/Controls';
import { BrandMark } from '@/components/app/Pieces';
import { useT } from '@/lib/i18n';
import { chooseLanguage } from '@/lib/session';

const HERO_ICONS: { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string; x: number; y: number; size: number }[] = [
  { icon: 'restaurant', bg: Colors.primary, fg: Colors.white, x: 0.5, y: 0.46, size: 84 },
  { icon: 'cafe-outline', bg: Colors.accentLight, fg: Colors.accentDark, x: 0.2, y: 0.22, size: 56 },
  { icon: 'pizza-outline', bg: '#FEF3C7', fg: '#B45309', x: 0.82, y: 0.2, size: 52 },
  { icon: 'wine-outline', bg: '#EDE9FE', fg: '#6D28D9', x: 0.14, y: 0.74, size: 50 },
  { icon: 'briefcase-outline', bg: Colors.primaryLight, fg: Colors.primaryDark, x: 0.84, y: 0.72, size: 58 },
];

/**
 * The first screen. Language comes before anything else because every word
 * after it — including the OTP SMS — should already be in the right one.
 *
 * "English" and "हिंदी" are hardcoded on purpose: each must read in its own
 * script whatever the current language is, or a Hindi reader stuck in English
 * could not find their way out.
 */
export default function Welcome() {
  const { t, locale } = useT();

  return (
    <Screen
      footer={<Button label={t('auth.welcome.cta')} size="lg" fullWidth iconRight="arrow-forward" onPress={() => router.push('/phone')} />}
    >
      <View style={styles.brandRow}>
        <BrandMark size={32} />
        <Txt variant="subheading">
          costonomy <Txt variant="subheading" color={Colors.primary}>jobs</Txt>
        </Txt>
      </View>

      <View style={styles.hero}>
        {HERO_ICONS.map((h) => (
          <View
            key={h.icon}
            style={[
              styles.heroIcon,
              {
                width: h.size,
                height: h.size,
                borderRadius: h.size / 2,
                backgroundColor: h.bg,
                left: `${h.x * 100}%`,
                top: `${h.y * 100}%`,
                marginLeft: -h.size / 2,
                marginTop: -h.size / 2,
              },
            ]}
          >
            <Ionicons name={h.icon} size={h.size * 0.44} color={h.fg} />
          </View>
        ))}
      </View>

      <Txt variant="display" style={{ fontSize: 32, lineHeight: locale === 'hi' ? 48 : 38 }}>
        {t('auth.welcome.title')}
      </Txt>
      <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
        {t('auth.welcome.subtitle')}
      </Txt>

      <Txt variant="captionStrong" color={Colors.textSecondary} style={{ marginTop: Spacing.xxl, marginBottom: Spacing.md }}>
        {t('auth.welcome.language')}
      </Txt>
      <View style={{ gap: Spacing.sm }}>
        <OptionCard title="English" subtitle="Continue in English" selected={locale === 'en'} onPress={() => chooseLanguage('en')} />
        <OptionCard title="हिंदी" subtitle="हिंदी में आगे बढ़ें" selected={locale === 'hi'} onPress={() => chooseLanguage('hi')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingTop: Spacing.md },
  hero: { height: 220, marginVertical: Spacing.lg },
  heroIcon: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
});
