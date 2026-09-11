import React, { useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Avatar, Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { Section, Tiles } from '@/components/app/Controls';
import { MatchPill, Tag } from '@/components/app/Pieces';
import { Sheet } from '@/components/app/Sheet';
import { ErrorView, Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, ApiError, type Job } from '@/lib/api';
import { experience, relativeTime, salaryRange } from '@/lib/format';
import { keys, useJob } from '@/lib/queries';

export default function JobDetail() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useJob(Number(id));
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);
  const [incomplete, setIncomplete] = useState<{ current: number; required: number } | null>(null);

  const job = query.data;
  if (query.isLoading) return <Loading />;
  if (!job) return <ErrorView error={query.error} onRetry={() => query.refetch()} />;

  const applicationId = job.myApplication?.applicationId;
  const open = job.status === 'OPEN';

  const footer = applicationId != null ? (
    <Button label={t('job.viewApplication')} variant="accent" size="lg" fullWidth icon="checkmark-circle" onPress={() => router.push(`/applications/${applicationId}`)} />
  ) : open ? (
    <Button label={t('job.apply')} size="lg" fullWidth onPress={() => setApplyOpen(true)} />
  ) : (
    <Txt variant="bodyStrong" color={Colors.textSecondary} align="center">
      {t('job.notOpen')}
    </Txt>
  );

  const openMaps = () => {
    const q = encodeURIComponent([job.outletAddress, job.localityDisplay, job.cityDisplay].filter(Boolean).join(', '));
    const coords = job.latitude != null && job.longitude != null ? `${job.latitude},${job.longitude}` : null;
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${coords ?? q}`
      : `https://www.google.com/maps/search/?api=1&query=${coords ?? q}`;
    void Linking.openURL(url);
  };

  return (
    <Screen header={<Header />} footer={footer}>
      <View style={styles.hero}>
        <Avatar name={job.restaurantName} uri={job.logoUrl} size="lg" shape="rounded" />
        <View style={{ flex: 1 }}>
          <Txt variant="title">{job.title}</Txt>
          <Txt variant="body" color={Colors.textSecondary}>
            {job.restaurantName}
          </Txt>
        </View>
      </View>

      <View style={styles.metaRow}>
        {job.matchScore != null && <MatchPill score={job.matchScore} />}
        <Tag label={unique([job.outletName, job.localityDisplay]).join(', ')} icon="location-outline" />
        {job.publishedAt != null && <Tag label={t('job.posted', { time: relativeTime(job.publishedAt) })} icon="time-outline" />}
      </View>

      <View style={styles.salaryCard}>
        <Txt variant="caption" color={Colors.accentDark}>
          {t('job.salary')}
        </Txt>
        <Txt variant="title" color={Colors.textPrimary}>
          {salaryRange(job.minSalary, job.maxSalary, job.salaryPeriod)}
        </Txt>
      </View>

      <View style={{ marginTop: Spacing.md }}>
        <Tiles
          items={[
            { icon: 'ribbon-outline', label: t('job.experience'), value: job.experienceMinMonths ? t('format.minExperience', { value: experience(job.experienceMinMonths) }) : t('job.anyExperience') },
            { icon: 'flash-outline', label: t('job.joining'), value: t(`joining.${job.joiningRequirement}` as MessageKey) },
            { icon: 'time-outline', label: t('job.shift'), value: job.shift ? t(`shift.${job.shift}` as MessageKey) : t('common.any') },
            { icon: 'people-outline', label: t('job.openings'), value: String(job.openings) },
          ]}
        />
      </View>

      {(job.mealsProvided || job.accommodationProvided || job.weeklyOffDays) ? (
        <Section title={t('job.perks')}>
          <View style={styles.tags}>
            {job.mealsProvided && <Tag label={t('job.meals')} icon="restaurant-outline" tone="accent" />}
            {job.accommodationProvided && <Tag label={t('job.accommodation')} icon="home-outline" tone="accent" />}
            {job.weeklyOffDays ? <Tag label={t('job.weeklyOff', { n: job.weeklyOffDays })} icon="calendar-outline" tone="accent" /> : null}
            <Tag label={t(`employment.${job.employmentType}` as MessageKey)} icon="briefcase-outline" tone="accent" />
          </View>
        </Section>
      ) : null}

      {job.description ? (
        <Section title={t('job.about')}>
          <Txt variant="body" color={Colors.textSecondary}>
            {job.description}
          </Txt>
        </Section>
      ) : null}

      {job.skills.length > 0 && (
        <Section title={t('job.skills')}>
          <View style={styles.tags}>
            {job.skills.map((s) => (
              <Tag key={s.skillId} label={s.nameDisplay ?? s.name} />
            ))}
          </View>
        </Section>
      )}

      <Section title={t('job.location')}>
        <View style={styles.location}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{job.outletName}</Txt>
            <Txt variant="caption" color={Colors.textSecondary}>
              {unique([job.outletAddress, job.localityDisplay, job.cityDisplay]).join(', ')}
            </Txt>
          </View>
          <Button label={t('job.openMaps')} variant="secondary" size="sm" icon="navigate-outline" onPress={openMaps} />
        </View>
      </Section>

      <ApplySheet
        job={job}
        visible={applyOpen}
        onClose={() => setApplyOpen(false)}
        onIncomplete={(current, required) => {
          setApplyOpen(false);
          setIncomplete({ current, required });
        }}
        onApplied={async () => {
          setApplyOpen(false);
          toast(t('apply.success'));
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: keys.job(job.id) }),
            queryClient.invalidateQueries({ queryKey: keys.myApplications }),
            queryClient.invalidateQueries({ queryKey: ['feed'] }),
          ]);
        }}
      />

      <Sheet
        visible={incomplete != null}
        onClose={() => setIncomplete(null)}
        title={t('apply.incomplete.title')}
        subtitle={incomplete ? t('apply.incomplete.body', incomplete) : undefined}
        footer={
          <Button
            label={t('apply.incomplete.cta')}
            size="lg"
            fullWidth
            onPress={() => {
              setIncomplete(null);
              router.push('/candidate/profile');
            }}
          />
        }
      >
        <View />
      </Sheet>
    </Screen>
  );
}

/** "Madhapur, Madhapur" happens whenever an outlet is named after its area. */
function unique(parts: (string | null | undefined)[]): string[] {
  return parts.filter((p, i): p is string => !!p && parts.findIndex((q) => q?.toLowerCase() === p.toLowerCase()) === i);
}

function ApplySheet({
  job,
  visible,
  onClose,
  onApplied,
  onIncomplete,
}: {
  job: Job;
  visible: boolean;
  onClose: () => void;
  onApplied: () => void;
  onIncomplete: (current: number, required: number) => void;
}) {
  const { t } = useT();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await api.jobs.apply(job.id, note.trim());
      setNote('');
      onApplied();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'PROFILE_INCOMPLETE') {
        // The message carries "You're at 25%, you need 40%"; the numbers are
        // pulled out so the sheet can say it in the user's words.
        const numbers = e.message.match(/\d+/g)?.map(Number) ?? [0, 40];
        onIncomplete(numbers[0] ?? 0, numbers[1] ?? 40);
      } else {
        setError(errorMessage(e, t('common.errorBody')));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('apply.title', { restaurant: job.restaurantName ?? '' })}
      subtitle={t('apply.subtitle')}
      footer={<Button label={t('apply.submit')} size="lg" fullWidth loading={busy} onPress={submit} />}
    >
      <TextField value={note} onChangeText={setNote} placeholder={t('apply.notePlaceholder')} multiline maxLength={1000} numberOfLines={4} />
      {error != null && (
        <Txt variant="caption" color={Colors.danger} style={{ marginTop: Spacing.sm }}>
          {error}
        </Txt>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, marginTop: Spacing.sm },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.lg },
  salaryCard: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.accentLight,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.background,
  },
});
