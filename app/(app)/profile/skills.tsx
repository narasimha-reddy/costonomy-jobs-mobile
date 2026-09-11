import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Chip } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { Section } from '@/components/app/Controls';
import { Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { keys, useMySkills, useSkills } from '@/lib/queries';

const ORDER = ['Cuisine', 'Technical', 'Language'];

/** Tap to add, tap again to remove — each tap saves, so there is no form to lose. */
export default function Skills() {
  const { t, tx } = useT();
  const queryClient = useQueryClient();
  const all = useSkills();
  const mine = useMySkills();
  const [pending, setPending] = useState<number | null>(null);

  const selected = useMemo(() => new Set((mine.data ?? []).map((s) => s.skillId)), [mine.data]);
  const grouped = useMemo(() => {
    const out: Record<string, NonNullable<typeof all.data>> = {};
    (all.data ?? []).forEach((s) => (out[s.category ?? 'Other'] ??= []).push(s));
    return Object.entries(out).sort(([a], [b]) => (ORDER.indexOf(a) + 99) % 100 - (ORDER.indexOf(b) + 99) % 100);
  }, [all.data]);

  if (all.isLoading || mine.isLoading) return <Loading />;

  const toggle = async (skillId: number) => {
    setPending(skillId);
    try {
      if (selected.has(skillId)) await api.profile.removeSkill(skillId);
      else await api.profile.addSkill(skillId);
      await queryClient.invalidateQueries({ queryKey: keys.mySkills });
      void queryClient.invalidateQueries({ queryKey: keys.profile });
    } catch (e) {
      toast(errorMessage(e, t('common.errorBody')), 'error');
    } finally {
      setPending(null);
    }
  };

  return (
    <Screen header={<Header title={t('skills.title')} />}>
      <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
        {t('skills.subtitle')}
      </Txt>
      {grouped.map(([category, skills]) => (
        <Section key={category} title={tx(`skills.category.${category}`, category)}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {skills.map((s) => (
              <Chip
                key={s.id}
                label={s.nameDisplay}
                selected={selected.has(s.id)}
                icon={selected.has(s.id) ? 'checkmark' : 'add'}
                disabled={pending === s.id}
                onPress={() => toggle(s.id)}
              />
            ))}
          </View>
        </Section>
      ))}
    </Screen>
  );
}
