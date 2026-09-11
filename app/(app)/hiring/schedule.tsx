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
import { ChipGroup, FieldLabel, Section, Segmented } from '@/components/app/Controls';
import { DayStrip, TimeGrid } from '@/components/app/Pieces';
import { errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { dateTimeLabel, toServerDateTime } from '@/lib/format';
import { useSession } from '@/lib/session';

type InterviewType = 'IN_PERSON' | 'PHONE' | 'VIDEO';

/**
 * Pick a day, tap a slot. Proposing a new interview and suggesting a new time for
 * an existing one are the same screen; the second also serves the candidate, who
 * sees none of the restaurant-only fields.
 */
export default function Schedule() {
  const { t } = useT();
  const { applicationId, interviewId } = useLocalSearchParams<{ applicationId: string; interviewId?: string }>();
  const rescheduling = interviewId != null;
  const { role } = useSession();
  const queryClient = useQueryClient();

  const [day, setDay] = useState<Date | null>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (new Date().getHours() >= 20) d.setDate(d.getDate() + 1);
    return d;
  });
  const [time, setTime] = useState<Date | null>(null);
  const [type, setType] = useState<InterviewType>('IN_PERSON');
  const [duration, setDuration] = useState(30);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const valid = time != null && (type === 'IN_PERSON' || location.trim().length > 3 || rescheduling);

  const submit = async () => {
    if (!time) return;
    setBusy(true);
    setError(undefined);
    try {
      const scheduledAt = toServerDateTime(time);
      if (rescheduling) {
        await api.interviews.reschedule(Number(interviewId), scheduledAt);
      } else {
        await api.interviews.propose(Number(applicationId), {
          scheduledAt,
          durationMinutes: duration,
          interviewType: type,
          location: type === 'IN_PERSON' ? null : location.trim(),
          notes: notes.trim() || null,
        });
      }
      void queryClient.invalidateQueries({ queryKey: ['restaurantApplication'] });
      void queryClient.invalidateQueries({ queryKey: ['applications'] });
      void queryClient.invalidateQueries({ queryKey: ['interview'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['job'] });
      toast(rescheduling ? t('schedule.rescheduled') : t('schedule.sent'));
      router.back();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<Header title={rescheduling ? t('schedule.rescheduleTitle') : t('schedule.title')} close />}
      footer={
        <View style={{ gap: Spacing.sm }}>
          {error != null && (
            <Txt variant="caption" color={Colors.danger} align="center">
              {error}
            </Txt>
          )}
          {time != null && (
            <Txt variant="captionStrong" color={Colors.textSecondary} align="center">
              {dateTimeLabel(time)}
            </Txt>
          )}
          <Button label={rescheduling ? t('schedule.rescheduleSubmit') : t('schedule.submit')} size="lg" fullWidth disabled={!valid} loading={busy} onPress={submit} />
        </View>
      }
    >
      <Section title={t('schedule.day')}>
        <DayStrip value={day} onChange={(d) => { setDay(d); setTime(null); }} />
      </Section>

      <Section title={t('schedule.time')}>
        <TimeGrid day={day} value={time} onChange={setTime} />
      </Section>

      {!rescheduling && role === 'restaurant' && (
        <>
          <Section title={t('schedule.type')}>
            <Segmented
              options={[
                { value: 'IN_PERSON', label: t('interview.type.IN_PERSON') },
                { value: 'PHONE', label: t('interview.type.PHONE') },
                { value: 'VIDEO', label: t('interview.type.VIDEO') },
              ]}
              value={type}
              onChange={setType}
            />
            {type !== 'IN_PERSON' && (
              <View style={{ marginTop: Spacing.lg }}>
                <TextField label={t('schedule.location')} value={location} onChangeText={setLocation} keyboardType={type === 'PHONE' ? 'phone-pad' : 'url'} />
              </View>
            )}
          </Section>

          <Section title={t('schedule.duration')}>
            <ChipGroup options={[15, 30, 45, 60].map((m) => ({ value: m, label: t('interview.minutes', { n: m }) }))} value={duration} onChange={setDuration} />
          </Section>

          <Section>
            <FieldLabel>{t('schedule.notes')}</FieldLabel>
            <TextField value={notes} onChangeText={setNotes} placeholder={t('schedule.notesPlaceholder')} multiline maxLength={2000} />
          </Section>
        </>
      )}
    </Screen>
  );
}
