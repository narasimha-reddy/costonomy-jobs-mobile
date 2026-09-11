import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { errorMessage } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';

export default function Phone() {
  const { t } = useT();
  const [digits, setDigits] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const valid = /^[6-9]\d{9}$/.test(digits);

  const send = async () => {
    if (!valid) {
      setError(t('auth.phone.invalid'));
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const mobile = `+91${digits}`;
      await api.auth.sendOtp(mobile);
      router.push({ pathname: '/otp', params: { mobile } });
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<Header onBack={() => (router.canGoBack() ? router.back() : router.replace('/welcome'))} />}
      footer={
        <View style={{ gap: Spacing.md }}>
          <Button label={t('auth.phone.cta')} size="lg" fullWidth loading={busy} disabled={digits.length < 10} onPress={send} />
          <Txt variant="caption" color={Colors.textTertiary} align="center">
            {t('auth.phone.terms')}
          </Txt>
        </View>
      }
    >
      <Txt variant="display" style={{ marginTop: Spacing.md }}>
        {t('auth.phone.title')}
      </Txt>
      <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.sm, marginBottom: Spacing.xxl }}>
        {t('auth.phone.subtitle')}
      </Txt>
      <TextField
        prefix="+91"
        value={digits}
        onChangeText={(v) => {
          setDigits(v.replace(/\D/g, '').slice(0, 10));
          setError(undefined);
        }}
        placeholder={t('auth.phone.placeholder')}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        autoFocus
        maxLength={10}
        error={error}
        onSubmitEditing={send}
      />
    </Screen>
  );
}
