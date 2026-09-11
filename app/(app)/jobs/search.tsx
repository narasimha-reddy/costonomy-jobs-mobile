import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { WEB_NO_OUTLINE } from '@/constants/platform';
import { FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { Chip, EmptyState, SkeletonList } from '@/components/ui';
import { IconButton } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { SelectSheet } from '@/components/app/Controls';
import { JobCard } from '@/components/app/Pieces';
import { ErrorView } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { DEFAULT_CITY_ID } from '@/lib/config';
import { JOINING, MIN_SALARIES, SHIFTS, SKILL_CATEGORY_ORDER } from '@/lib/options';
import { useFeed, useLocalities, useRoles, useSkills } from '@/lib/queries';
import { rupeesShort } from '@/lib/format';
import { useFontFamily } from '@/hooks/useFontFamily';
import type { JoiningRequirement, Shift } from '@/lib/api';

/**
 * Keyword and filter search. Every filter is a chip that opens its own short
 * picker, so the common case — "Commis jobs in Madhapur" — is two taps, and no
 * filter form stands between someone and the results.
 */
export default function Search() {
  const { t, tx } = useT();
  const { font } = useFontFamily();
  const roles = useRoles().data ?? [];
  const localities = useLocalities(DEFAULT_CITY_ID).data ?? [];
  const skills = useSkills().data ?? [];

  const [text, setText] = useState('');
  const [q, setQ] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [localityId, setLocalityId] = useState<number | null>(null);
  const [joining, setJoining] = useState<JoiningRequirement | null>(null);
  const [shift, setShift] = useState<Shift | null>(null);
  const [minSalary, setMinSalary] = useState<number | null>(null);
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [picker, setPicker] = useState<'role' | 'area' | 'joining' | 'shift' | 'pay' | 'skills' | null>(null);

  // Debounced: a query per keystroke on mobile data is a query per wasted second.
  useEffect(() => {
    const id = setTimeout(() => setQ(text.trim()), 350);
    return () => clearTimeout(id);
  }, [text]);

  const params = useMemo(
    () => ({
      cityId: DEFAULT_CITY_ID,
      q: q || undefined,
      roleId: roleId ?? undefined,
      localityId: localityId ?? undefined,
      joiningRequirement: joining ?? undefined,
      shift: shift ?? undefined,
      minSalary: minSalary ?? undefined,
      skillIds: skillIds.length ? skillIds : undefined,
      sort: 'newest' as const,
    }),
    [q, roleId, localityId, joining, shift, minSalary, skillIds],
  );
  const feed = useFeed(params);
  const jobs = useMemo(() => feed.data?.pages.flatMap((p) => p.data) ?? [], [feed.data]);
  const anyFilter = roleId != null || localityId != null || joining != null || shift != null || minSalary != null || skillIds.length > 0;

  const roleName = roles.find((r) => r.id === roleId)?.nameDisplay;
  const areaName = localities.find((l) => l.id === localityId)?.nameDisplay;

  return (
    <SafeAreaView edges={['top']} style={styles.fill}>
      <View style={styles.bar}>
        <IconButton icon="chevron-back" label="Back" onPress={() => router.back()} />
        <View style={styles.input}>
          <Ionicons name="search" size={18} color={Colors.textTertiary} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('search.placeholder')}
            placeholderTextColor={Colors.textTertiary}
            autoFocus
            returnKeyType="search"
            style={[styles.inputText, { fontFamily: font('regular') }]}
          />
          {text.length > 0 && <IconButton icon="close-circle" label="Clear" color={Colors.textTertiary} onPress={() => setText('')} />}
        </View>
      </View>

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label={roleName ?? t('search.role')} selected={roleId != null} icon="restaurant-outline" onPress={() => setPicker('role')} onRemove={roleId != null ? () => setRoleId(null) : undefined} />
          <Chip label={areaName ?? t('search.area')} selected={localityId != null} icon="location-outline" onPress={() => setPicker('area')} onRemove={localityId != null ? () => setLocalityId(null) : undefined} />
          <Chip label={joining ? t(`joining.${joining}` as MessageKey) : t('search.joining')} selected={joining != null} icon="flash-outline" onPress={() => setPicker('joining')} onRemove={joining ? () => setJoining(null) : undefined} />
          <Chip label={minSalary ? t('search.payFrom', { amount: rupeesShort(minSalary) }) : t('search.pay')} selected={minSalary != null} icon="cash-outline" onPress={() => setPicker('pay')} onRemove={minSalary ? () => setMinSalary(null) : undefined} />
          <Chip label={skillIds.length ? t('search.skillsCount', { count: skillIds.length }) : t('search.skills')} selected={skillIds.length > 0} icon="sparkles-outline" onPress={() => setPicker('skills')} onRemove={skillIds.length ? () => setSkillIds([]) : undefined} />
          <Chip label={shift ? t(`shift.${shift}` as MessageKey) : t('search.shift')} selected={shift != null} icon="time-outline" onPress={() => setPicker('shift')} onRemove={shift ? () => setShift(null) : undefined} />
        </ScrollView>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(j) => String(j.id)}
        contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.section }}
        ListHeaderComponent={
          !feed.isLoading && jobs.length > 0 ? (
            <Txt variant="captionStrong" color={Colors.textSecondary}>
              {t('search.results', { count: jobs.length + (feed.hasNextPage ? '+' : '') })}
            </Txt>
          ) : null
        }
        renderItem={({ item }) => <JobCard job={item} onPress={() => router.push(`/jobs/${item.id}`)} />}
        ListEmptyComponent={
          feed.isLoading ? (
            <SkeletonList rows={3} />
          ) : feed.isError ? (
            <ErrorView error={feed.error} onRetry={() => feed.refetch()} />
          ) : (
            <EmptyState
              icon="search-outline"
              title={t('search.empty.title')}
              subtitle={t('search.empty.body')}
              actionLabel={anyFilter ? t('search.clear') : undefined}
              onAction={() => {
                setRoleId(null);
                setLocalityId(null);
                setJoining(null);
                setShift(null);
                setMinSalary(null);
                setSkillIds([]);
              }}
            />
          )
        }
        onEndReached={() => feed.hasNextPage && !feed.isFetchingNextPage && feed.fetchNextPage()}
        ListFooterComponent={feed.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} /> : null}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      />

      <SelectSheet
        visible={picker === 'role'}
        onClose={() => setPicker(null)}
        title={t('search.role')}
        options={roles.map((r) => ({ value: r.id, label: r.nameDisplay, group: t(`roleCategory.${r.category}` as MessageKey) }))}
        value={roleId}
        onChange={(v) => { setRoleId(v); setPicker(null); }}
      />
      <SelectSheet
        visible={picker === 'area'}
        onClose={() => setPicker(null)}
        title={t('search.area')}
        options={localities.map((l) => ({ value: l.id, label: l.nameDisplay }))}
        value={localityId}
        onChange={(v) => { setLocalityId(v); setPicker(null); }}
      />
      <SelectSheet
        visible={picker === 'joining'}
        onClose={() => setPicker(null)}
        title={t('search.joining')}
        searchable={false}
        options={JOINING.map((j) => ({ value: j, label: t(`joining.${j}` as MessageKey) }))}
        value={joining}
        onChange={(v) => { setJoining(v); setPicker(null); }}
      />
      <SelectSheet
        visible={picker === 'pay'}
        onClose={() => setPicker(null)}
        title={t('search.pay')}
        searchable={false}
        options={MIN_SALARIES.map((v) => ({ value: v, label: t('search.payFrom', { amount: rupeesShort(v) }) }))}
        value={minSalary}
        onChange={(v) => { setMinSalary(v); setPicker(null); }}
      />
      <SelectSheet
        visible={picker === 'skills'}
        onClose={() => setPicker(null)}
        title={t('search.skills')}
        multiple
        options={sortedSkills(skills).map((s) => ({ value: s.id, label: s.nameDisplay, group: tx(`skills.category.${s.category ?? 'Other'}`, s.category ?? '') }))}
        value={skillIds}
        onChange={setSkillIds}
      />
      <SelectSheet
        visible={picker === 'shift'}
        onClose={() => setPicker(null)}
        title={t('search.shift')}
        searchable={false}
        options={SHIFTS.map((s) => ({ value: s, label: t(`shift.${s}` as MessageKey) }))}
        value={shift}
        onChange={(v) => { setShift(v); setPicker(null); }}
      />
    </SafeAreaView>
  );
}

/** Grouped for the picker: cuisines first, then skills, then languages. */
function sortedSkills<S extends { category: string | null; nameDisplay: string }>(list: S[]): S[] {
  const rank = (c: string | null) => { const i = SKILL_CATEGORY_ORDER.indexOf(c ?? ''); return i < 0 ? 99 : i; };
  return [...list].sort((a, b) => rank(a.category) - rank(b.category) || a.nameDisplay.localeCompare(b.nameDisplay));
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', paddingRight: Spacing.lg, paddingLeft: Spacing.xs, paddingVertical: Spacing.sm, backgroundColor: Colors.surface },
  input: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceSunken,
    borderRadius: Spacing.radiusFull,
    paddingLeft: Spacing.lg,
    minHeight: 48,
  },
  inputText: { flex: 1, ...WEB_NO_OUTLINE, fontSize: FontSize.md, color: Colors.textPrimary, paddingVertical: Spacing.sm },
  chips: { gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, backgroundColor: Colors.surface },
});
