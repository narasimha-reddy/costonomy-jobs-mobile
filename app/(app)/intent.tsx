import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Screen } from '@/components/app/Screen';
import { Txt } from '@/components/app/Txt';
import { OptionCard } from '@/components/app/Controls';
import { useT } from '@/lib/i18n';

/**
 * First sign-in only. Routes to the right onboarding; it creates nothing itself,
 * and it offers no "both" option — the second side is added later from Settings,
 * which keeps a first sign-in to one clear choice.
 */
export default function Intent() {
  const { t } = useT();
  return (
    <Screen>
      <Txt variant="display" style={{ marginTop: Spacing.section }}>
        {t('auth.intent.title')}
      </Txt>
      <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xxl }}>
        {t('auth.intent.subtitle')}
      </Txt>
      <View style={{ gap: Spacing.md }}>
        <OptionCard
          icon="search"
          title={t('auth.intent.job.title')}
          subtitle={t('auth.intent.job.subtitle')}
          onPress={() => router.push('/onboarding/candidate')}
        />
        <OptionCard
          icon="people"
          title={t('auth.intent.hire.title')}
          subtitle={t('auth.intent.hire.subtitle')}
          onPress={() => router.push('/onboarding/restaurant')}
        />
      </View>
    </Screen>
  );
}
