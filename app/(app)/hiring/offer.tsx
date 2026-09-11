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
import { FieldLabel, Section } from '@/components/app/Controls';
import { AmountInput, DayStrip } from '@/components/app/Pieces';
import { errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { dayLabel, rupees, toServerDate } from '@/lib/format';

export default function OfferForm() {
  const { t } = useT();
  const { applicationId, expected, name } = useLocalSearchParams<{ applicationId: string; expected?: string; name?: string }>();
  const queryClient = useQueryClient();
  const [salary, setSalary] = useState(expected ?? '');
  const [date, setDate] = useState<Date | null>(null);
  const [benefits, setBenefits] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const send = async () => {
    if (!date) return;
    setBusy(true);
    setError(undefined);
    try {
      const offer = await api.offers.create(Number(applicationId), {
        salary: Number(salary),
        joiningDate: toServerDate(date),
        benefits: benefits.trim() || null,
        send: true,
      });
      void queryClient.invalidateQueries({ queryKey: ['restaurantApplication'] });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      void queryClient.invalidateQueries({ queryKey: ['job'] });
      toast(t('offerForm.sent'));
      router.replace(`/offers/${offer.id}`);
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<Header title={t('offerForm.title')} close />}
      footer={
        <View style={{ gap: Spacing.sm }}>
          {error != null && (
            <Txt variant="caption" color={Colors.danger} align="center">
              {error}
            </Txt>
          )}
          {date != null && (
            <Txt variant="captionStrong" color={Colors.textSecondary} align="center">
              {t('offerForm.joiningSummary', { date: dayLabel(date) })}
            </Txt>
          )}
          <Button label={t('offerForm.send')} size="lg" fullWidth icon="send" disabled={!(Number(salary) > 0 && date)} loading={busy} onPress={send} />
        </View>
      }
    >
      {name ? (
        <Txt variant="title" style={{ marginTop: Spacing.md }}>
          {name}
        </Txt>
      ) : null}

      <Section>
        <FieldLabel hint={expected ? t('offerForm.salaryHint', { amount: rupees(Number(expected)) }) : undefined}>{t('offerForm.salary')}</FieldLabel>
        <AmountInput value={salary} onChange={setSalary} placeholder="20000" />
      </Section>

      <Section title={t('offerForm.joiningDate')}>
        <DayStrip value={date} onChange={setDate} days={30} startOffset={1} />
      </Section>

      <Section>
        <TextField label={t('offerForm.benefits')} value={benefits} onChangeText={setBenefits} placeholder={t('offerForm.benefitsPlaceholder')} multiline maxLength={2000} />
      </Section>
    </Screen>
  );
}
