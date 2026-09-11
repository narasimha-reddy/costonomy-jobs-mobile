import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, ProgressBar, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ChipGroup, FieldLabel, OptionCard } from '@/components/app/Controls';
import { AmountInput } from '@/components/app/Pieces';
import { errorMessage } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, type Availability } from '@/lib/api';
import { DEFAULT_CITY_ID } from '@/lib/config';
import { rupeesShort } from '@/lib/format';
import { keys, useLocalities, useRoles } from '@/lib/queries';
import { refreshMe, setRole, useSession } from '@/lib/session';

type Step = 'name' | 'role' | 'experience' | 'location' | 'pay';

const EXPERIENCE: { key: MessageKey; months: number }[] = [
  { key: 'experience.fresher', months: 0 },
  { key: 'experience.lt1', months: 6 },
  { key: 'experience.1to2', months: 18 },
  { key: 'experience.2to5', months: 42 },
  { key: 'experience.5plus', months: 72 },
];

/** Where most of this audience works, first. */
const CATEGORY_ORDER = ['KITCHEN', 'SERVICE', 'OPERATIONS_SUPPORT', 'MANAGEMENT'];

const SALARY_PRESETS = [12000, 15000, 18000, 22000, 26000, 32000];
const AVAILABILITY: Availability[] = ['IMMEDIATE', 'WITHIN_15_DAYS', 'WITHIN_30_DAYS'];

/**
 * The five answers that make a profile usable: enough for relevance ranking and
 * over the 40% apply floor. Skills, work history and preferences come later, from
 * the profile screen, where they don't stand between someone and their first job.
 */
export default function CandidateOnboarding() {
  const { t } = useT();
  const { me } = useSession();
  const queryClient = useQueryClient();
  const roles = useRoles().data ?? [];
  const localities = useLocalities(DEFAULT_CITY_ID).data ?? [];

  const steps: Step[] = useMemo(
    () => (me?.user.name ? ['role', 'experience', 'location', 'pay'] : ['name', 'role', 'experience', 'location', 'pay']),
    [me?.user.name],
  );
  const [index, setIndex] = useState(0);
  const step = steps[index]!;

  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [months, setMonths] = useState<number | null>(null);
  const [localityId, setLocalityId] = useState<number | null>(null);
  const [salary, setSalary] = useState('');
  const [availability, setAvailability] = useState<Availability>('IMMEDIATE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  // Creates the empty profile row up front, so abandoning halfway still leaves
  // something the profile screen can pick up from.
  useEffect(() => {
    void api.profile.get().catch(() => {});
  }, []);

  const valid =
    (step === 'name' && name.trim().length > 1) ||
    (step === 'role' && roleId != null) ||
    (step === 'experience' && months != null) ||
    (step === 'location' && localityId != null) ||
    (step === 'pay' && Number(salary) > 0);

  const next = async () => {
    if (index < steps.length - 1) {
      setIndex(index + 1);
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await api.profile.update({
        name: name.trim() || undefined,
        currentCityId: DEFAULT_CITY_ID,
        currentLocalityId: localityId,
        primaryRoleId: roleId,
        totalExperienceMonths: months ?? 0,
        expectedSalary: Number(salary),
        availability,
      });
      await api.profile.updatePreferences({ preferredLocations: [{ cityId: DEFAULT_CITY_ID, localityId: null }] });
      await queryClient.invalidateQueries({ queryKey: keys.profile });
      await refreshMe();
      await setRole('candidate');
      router.replace('/candidate');
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  const grouped = useMemo(() => {
    const out: Record<string, typeof roles> = {};
    [...roles]
      .sort((a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) || a.sortOrder - b.sortOrder)
      .forEach((r) => (out[r.category] ??= []).push(r));
    return out;
  }, [roles]);

  return (
    <Screen
      header={
        <View>
          <Header onBack={() => (index > 0 ? setIndex(index - 1) : router.back())} />
          <View style={styles.progress}>
            <ProgressBar value={((index + 1) / steps.length) * 100} showValue={false} />
            <Txt variant="caption" color={Colors.textSecondary} style={{ marginTop: 6 }}>
              {t('onboard.step', { current: index + 1, total: steps.length })}
            </Txt>
          </View>
        </View>
      }
      footer={
        <View style={{ gap: Spacing.sm }}>
          {error != null && (
            <Txt variant="caption" color={Colors.danger} align="center">
              {error}
            </Txt>
          )}
          <Button
            label={index === steps.length - 1 ? t('onboard.finish') : t('common.continue')}
            size="lg"
            fullWidth
            disabled={!valid}
            loading={busy}
            iconRight={index === steps.length - 1 ? undefined : 'arrow-forward'}
            onPress={next}
          />
        </View>
      }
    >
      {step === 'name' && (
        <StepHead title={t('onboard.name.title')} subtitle={t('onboard.name.subtitle')}>
          <TextField value={name} onChangeText={setName} placeholder={t('onboard.name.placeholder')} autoFocus autoCapitalize="words" textContentType="name" />
        </StepHead>
      )}

      {step === 'role' && (
        <StepHead title={t('onboard.role.title')} subtitle={t('onboard.role.subtitle')}>
          {Object.entries(grouped).map(([category, list]) => (
            <View key={category} style={{ marginBottom: Spacing.xl }}>
              <Txt variant="captionStrong" color={Colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
                {t(`roleCategory.${category}` as MessageKey)}
              </Txt>
              <ChipGroup options={list.map((r) => ({ value: r.id, label: r.nameDisplay }))} value={roleId} onChange={setRoleId} />
            </View>
          ))}
        </StepHead>
      )}

      {step === 'experience' && (
        <StepHead title={t('onboard.experience.title')} subtitle={t('onboard.experience.subtitle')}>
          <View style={{ gap: Spacing.sm }}>
            {EXPERIENCE.map((e) => (
              <OptionCard key={e.key} title={t(e.key)} selected={months === e.months} onPress={() => setMonths(e.months)} />
            ))}
          </View>
        </StepHead>
      )}

      {step === 'location' && (
        <StepHead title={t('onboard.location.title')} subtitle={t('onboard.location.subtitle')}>
          <ChipGroup options={localities.map((l) => ({ value: l.id, label: l.nameDisplay, icon: 'location-outline' as const }))} value={localityId} onChange={setLocalityId} />
        </StepHead>
      )}

      {step === 'pay' && (
        <StepHead title={t('onboard.salary.title')} subtitle={t('onboard.salary.subtitle')}>
          <FieldLabel>{t('onboard.salary.label')}</FieldLabel>
          <AmountInput value={salary} onChange={setSalary} placeholder="18000" />
          <View style={{ marginTop: Spacing.md }}>
            <ChipGroup
              options={SALARY_PRESETS.map((s) => ({ value: s, label: rupeesShort(s) }))}
              value={Number(salary) || null}
              onChange={(v: number) => setSalary(String(v))}
            />
          </View>
          <View style={{ marginTop: Spacing.xxl }}>
            <FieldLabel>{t('onboard.availability.label')}</FieldLabel>
            <View style={{ gap: Spacing.sm }}>
              {AVAILABILITY.map((a) => (
                <OptionCard key={a} title={t(`availability.${a}` as MessageKey)} selected={availability === a} onPress={() => setAvailability(a)} />
              ))}
            </View>
          </View>
        </StepHead>
      )}
    </Screen>
  );
}

function StepHead({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View>
      <Txt variant="display" style={{ marginTop: Spacing.lg }}>
        {title}
      </Txt>
      <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.xs, marginBottom: Spacing.xxl }}>
        {subtitle}
      </Txt>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  progress: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
});
