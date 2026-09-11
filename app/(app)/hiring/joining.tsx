import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { OptionCard } from '@/components/app/Controls';
import { errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';

/**
 * Whether the hire actually happened. The product counts joins, not accepted
 * offers, so this is the most important single tap a restaurant makes.
 */
export default function JoiningRecord() {
  const { t } = useT();
  const { applicationId, name } = useLocalSearchParams<{ applicationId: string; name?: string }>();
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = useState<'JOINED' | 'DID_NOT_JOIN' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const confirm = async () => {
    if (!outcome) return;
    setBusy(true);
    setError(undefined);
    try {
      await api.offers.recordJoining(Number(applicationId), { outcome, reason: reason.trim() || null });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['restaurantApplication'] }),
        queryClient.invalidateQueries({ queryKey: ['offer'] }),
        queryClient.invalidateQueries({ queryKey: ['applications'] }),
        queryClient.invalidateQueries({ queryKey: ['job'] }),
      ]);
      toast(t('joiningForm.saved'));
      router.back();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<Header close />}
      footer={
        <View style={{ gap: Spacing.sm }}>
          {error != null && (
            <Txt variant="caption" color={Colors.danger} align="center">
              {error}
            </Txt>
          )}
          <Button label={t('joiningForm.submit')} size="lg" fullWidth disabled={!outcome} loading={busy} onPress={confirm} />
        </View>
      }
    >
      <Txt variant="display" style={{ marginTop: Spacing.lg }}>
        {t('joiningForm.title')}
      </Txt>
      <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.xs, marginBottom: Spacing.xxl }}>
        {t('joiningForm.subtitle', { name: name ?? '' })}
      </Txt>
      <View style={{ gap: Spacing.sm }}>
        <OptionCard icon="checkmark-circle" title={t('joiningForm.joined')} selected={outcome === 'JOINED'} onPress={() => setOutcome('JOINED')} />
        <OptionCard icon="close-circle" title={t('joiningForm.didNotJoin')} selected={outcome === 'DID_NOT_JOIN'} onPress={() => setOutcome('DID_NOT_JOIN')} />
      </View>
      {outcome === 'DID_NOT_JOIN' && (
        <View style={{ marginTop: Spacing.xl }}>
          <TextField value={reason} onChangeText={setReason} placeholder={t('joiningForm.reason')} multiline maxLength={500} />
        </View>
      )}
    </Screen>
  );
}
