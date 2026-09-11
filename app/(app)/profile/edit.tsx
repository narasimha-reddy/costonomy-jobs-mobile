import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ChipGroup, FieldLabel, SelectField, Stepper } from '@/components/app/Controls';
import { AmountInput } from '@/components/app/Pieces';
import { Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, type Availability } from '@/lib/api';
import { DEFAULT_CITY_ID } from '@/lib/config';
import { AVAILABILITIES } from '@/lib/options';
import { keys, useLocalities, useProfile, useRoles } from '@/lib/queries';
import { refreshMe } from '@/lib/session';

export default function ProfileEdit() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const profile = useProfile().data;
  const roles = useRoles().data ?? [];
  const localities = useLocalities(DEFAULT_CITY_ID).data ?? [];

  const [name, setName] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [localityId, setLocalityId] = useState<number | null>(null);
  const [years, setYears] = useState(0);
  const [months, setMonths] = useState(0);
  const [salary, setSalary] = useState('');
  const [availability, setAvailability] = useState<Availability>('IMMEDIATE');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setRoleId(profile.primaryRoleId);
    setLocalityId(profile.currentLocalityId);
    setYears(Math.floor(profile.totalExperienceMonths / 12));
    setMonths(profile.totalExperienceMonths % 12);
    setSalary(profile.expectedSalary ? String(profile.expectedSalary) : '');
    setAvailability(profile.availability);
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!profile) return <Loading />;

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await api.profile.update({
        name: name.trim() || null,
        currentCityId: DEFAULT_CITY_ID,
        currentLocalityId: localityId,
        primaryRoleId: roleId,
        totalExperienceMonths: years * 12 + months,
        expectedSalary: salary ? Number(salary) : null,
        availability,
      });
      await queryClient.invalidateQueries({ queryKey: keys.profile });
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      void refreshMe();
      toast(t('profileEdit.saved'));
      router.back();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<Header title={t('profileEdit.title')} />}
      footer={
        <View style={{ gap: Spacing.sm }}>
          {error != null && (
            <Txt variant="caption" color={Colors.danger} align="center">
              {error}
            </Txt>
          )}
          <Button label={t('common.saveChanges')} size="lg" fullWidth loading={busy} onPress={save} />
        </View>
      }
    >
      <View style={{ gap: Spacing.xxl, marginTop: Spacing.md }}>
        <TextField label={t('profileEdit.name')} value={name} onChangeText={setName} autoCapitalize="words" />

        <SelectField
          label={t('profileEdit.role')}
          placeholder={t('jobForm.rolePlaceholder')}
          icon="restaurant-outline"
          options={roles.map((r) => ({ value: r.id, label: r.nameDisplay, group: t(`roleCategory.${r.category}` as MessageKey) }))}
          value={roleId}
          onChange={setRoleId}
        />

        <SelectField
          label={t('profileEdit.area')}
          placeholder={t('search.area')}
          icon="location-outline"
          options={localities.map((l) => ({ value: l.id, label: l.nameDisplay }))}
          value={localityId}
          onChange={setLocalityId}
        />

        <View>
          <FieldLabel>{t('profileEdit.experience')}</FieldLabel>
          <View style={{ flexDirection: 'row', gap: Spacing.xxl }}>
            <View style={{ gap: 6 }}>
              <Txt variant="caption" color={Colors.textSecondary}>
                {t('profileEdit.years')}
              </Txt>
              <Stepper value={years} onChange={setYears} max={40} />
            </View>
            <View style={{ gap: 6 }}>
              <Txt variant="caption" color={Colors.textSecondary}>
                {t('profileEdit.months')}
              </Txt>
              <Stepper value={months} onChange={setMonths} max={11} />
            </View>
          </View>
        </View>

        <View>
          <FieldLabel>{t('profileEdit.expectedSalary')}</FieldLabel>
          <AmountInput value={salary} onChange={setSalary} placeholder="18000" />
        </View>

        <View>
          <FieldLabel>{t('profileEdit.availability')}</FieldLabel>
          <ChipGroup options={AVAILABILITIES.map((a) => ({ value: a, label: t(`availability.${a}` as MessageKey) }))} value={availability} onChange={setAvailability} />
        </View>
      </View>
    </Screen>
  );
}
