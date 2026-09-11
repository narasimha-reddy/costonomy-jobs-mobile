import React, { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { OtpInput } from '@/components/app/Pieces';
import { errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { formatMobile } from '@/lib/format';
import { signIn } from '@/lib/session';

const RESEND_SECONDS = 30;

export default function Otp() {
  const { t, locale } = useT();
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  // Submits on the sixth digit: one less tap, and the moment someone is most
  // sure they typed it right.
  useEffect(() => {
    if (code.length === 6 && !busy) void verify(code);
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  const verify = async (otp: string) => {
    setBusy(true);
    setError(undefined);
    try {
      const response = await api.auth.verifyOtp(mobile, otp, locale);
      await signIn(response);
      router.replace('/');
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await api.auth.sendOtp(mobile);
      setWait(RESEND_SECONDS);
      toast(t('auth.otp.resent'));
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    }
  };

  return (
    <Screen header={<Header />}>
      <Txt variant="display" style={{ marginTop: Spacing.md }}>
        {t('auth.otp.title')}
      </Txt>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm, marginBottom: Spacing.xxl }}>
        <Txt variant="body" color={Colors.textSecondary}>
          {t('auth.otp.subtitle', { phone: formatMobile(mobile ?? '') })}
        </Txt>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button">
          <Txt variant="bodyStrong" color={Colors.primary}>
            {t('auth.otp.change')}
          </Txt>
        </TouchableOpacity>
      </View>

      <OtpInput value={code} onChange={(v) => { setCode(v); setError(undefined); }} error={error != null} />

      <View style={{ minHeight: 28, marginTop: Spacing.md }}>
        {busy ? (
          <ActivityIndicator color={Colors.primary} style={{ alignSelf: 'flex-start' }} />
        ) : error != null ? (
          <Txt variant="captionStrong" color={Colors.danger}>
            {error}
          </Txt>
        ) : null}
      </View>

      <View style={{ marginTop: Spacing.lg }}>
        {wait > 0 ? (
          <Txt variant="body" color={Colors.textTertiary}>
            {t('auth.otp.resendIn', { seconds: wait })}
          </Txt>
        ) : (
          <TouchableOpacity onPress={resend} accessibilityRole="button" style={{ alignSelf: 'flex-start', paddingVertical: Spacing.sm }}>
            <Txt variant="bodyStrong" color={Colors.primary}>
              {t('auth.otp.resend')}
            </Txt>
          </TouchableOpacity>
        )}
      </View>
    </Screen>
  );
}
