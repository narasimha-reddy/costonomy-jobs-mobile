import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ChipGroup, Section, SelectField } from '@/components/app/Controls';
import { Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, type Shift } from '@/lib/api';
import { DEFAULT_CITY_ID } from '@/lib/config';
import { SHIFTS } from '@/lib/options';
import { keys, useLocalities, usePreferences, useRoles } from '@/lib/queries';

const ANYWHERE = 0;

export default function Preferences() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const prefs = usePreferences();
  const roles = useRoles().data ?? [];
  const localities = useLocalities(DEFAULT_CITY_ID).data ?? [];

  const [areas, setAreas] = useState<number[]>([]);
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!prefs.data) return;
    setAreas(prefs.data.preferredLocations.map((l) => l.localityId ?? ANYWHERE));
    setRoleIds(prefs.data.preferredRoleIds);
    setShifts(prefs.data.preferredShifts);
  }, [prefs.data]);

  if (prefs.isLoading) return <Loading />;

  // "Anywhere" and specific areas are mutually exclusive: picking one clears the other.
  const onAreas = (next: number[]) => {
    const added = next.find((a) => !areas.includes(a));
    if (added === ANYWHERE) setAreas([ANYWHERE]);
    else setAreas(next.filter((a) => a !== ANYWHERE));
  };

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await api.profile.updatePreferences({
        preferredLocations: areas.map((a) => ({ cityId: DEFAULT_CITY_ID, localityId: a === ANYWHERE ? null : a })),
        preferredRoleIds: roleIds,
        preferredShifts: shifts,
      });
      await queryClient.invalidateQueries({ queryKey: keys.preferences });
      void queryClient.invalidateQueries({ queryKey: keys.profile });
      void queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast(t('preferences.saved'));
      router.back();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<Header title={t('preferences.title')} />}
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
      <Section title={t('preferences.areas')}>
        <ChipGroup
          multiple
          options={[{ value: ANYWHERE, label: t('preferences.anywhere'), icon: 'globe-outline' as const }, ...localities.map((l) => ({ value: l.id, label: l.nameDisplay }))]}
          value={areas}
          onChange={onAreas}
        />
      </Section>
      <Section title={t('preferences.roles')}>
        <SelectField
          multiple
          placeholder={t('jobForm.rolePlaceholder')}
          options={roles.map((r) => ({ value: r.id, label: r.nameDisplay, group: t(`roleCategory.${r.category}` as MessageKey) }))}
          value={roleIds}
          onChange={setRoleIds}
        />
      </Section>
      <Section title={t('preferences.shifts')}>
        <ChipGroup multiple options={SHIFTS.map((s) => ({ value: s, label: t(`shift.${s}` as MessageKey) }))} value={shifts} onChange={setShifts} />
      </Section>
    </Screen>
  );
}
