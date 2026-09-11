import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Chip } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { Section, Segmented } from '@/components/app/Controls';
import { Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api, type Proficiency } from '@/lib/api';
import { keys, useMySkills, useSkills } from '@/lib/queries';
import { SKILL_CATEGORY_ORDER } from '@/lib/options';


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
    // Cuisines first: for a cook they say more than anything else on the list.
    const rank = (c: string) => { const i = SKILL_CATEGORY_ORDER.indexOf(c); return i < 0 ? 99 : i; };
    return Object.entries(out).sort(([a], [b]) => rank(a) - rank(b));
  }, [all.data]);

  if (all.isLoading || mine.isLoading) return <Loading />;

  const setLevel = async (skillId: number, proficiency: Proficiency) => {
    // Optimistic: the segment moves on tap, and a failure puts it back.
    const previous = queryClient.getQueryData(keys.mySkills);
    queryClient.setQueryData(keys.mySkills, (list: typeof mine.data) =>
      list?.map((s) => (s.skillId === skillId ? { ...s, proficiency } : s)));
    try {
      await api.profile.addSkill(skillId, proficiency);
    } catch (e) {
      queryClient.setQueryData(keys.mySkills, previous);
      toast(errorMessage(e, t('common.errorBody')), 'error');
    }
  };
  const levels: { value: Proficiency; label: string }[] = [
    { value: 'BEGINNER', label: t('skills.level.BEGINNER') },
    { value: 'INTERMEDIATE', label: t('skills.level.INTERMEDIATE') },
    { value: 'EXPERT', label: t('skills.level.EXPERT') },
  ];

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

      {(mine.data?.length ?? 0) > 0 && (
        <Section title={t('skills.levelTitle')}>
          <Txt variant="caption" color={Colors.textSecondary} style={{ marginBottom: Spacing.md }}>
            {t('skills.levelHint')}
          </Txt>
          <View style={styles.panel}>
            {mine.data!.map((s, i) => (
              <View key={s.skillId} style={[styles.levelRow, i > 0 && styles.divider]}>
                <Txt variant="body" weight="medium">
                  {s.nameDisplay}
                </Txt>
                <Segmented options={levels} value={(s.proficiency ?? 'NONE') as Proficiency} onChange={(v) => void setLevel(s.skillId, v)} />
              </View>
            ))}
          </View>
        </Section>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: Spacing.radiusLg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
  levelRow: { padding: Spacing.lg, gap: Spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
});
