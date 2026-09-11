import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { Avatar, Button, Chip, EmptyState, ProgressBar, SkeletonList } from '@/components/ui';
import { LargeTitle } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ListGroup, ListRow, SelectSheet } from '@/components/app/Controls';
import { Sheet } from '@/components/app/Sheet';
import { ErrorView } from '@/components/app/Feedback';
import { ContactSheet } from '@/components/app/ContactSheet';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, type Availability, type CandidateResult } from '@/lib/api';
import { experience, rupees, rupeesShort } from '@/lib/format';
import { EXPERIENCE_MINIMUMS, LOOKING, MAX_EXPECTED_SALARIES, SKILL_CATEGORY_ORDER } from '@/lib/options';
import { keys, useLocalities, useOutlets, useRestaurantJobs, useRoles, useSkills } from '@/lib/queries';
import { useSession } from '@/lib/session';
import { useResponsive } from '@/hooks/useResponsive';

const rank = (category: string | null) => {
  const i = SKILL_CATEGORY_ORDER.indexOf(category ?? '');
  return i < 0 ? 99 : i;
};

const SIGNALS = ['role', 'location', 'experience', 'salary', 'availability', 'cuisine', 'skills'];

/**
 * Proactive search for people who haven't applied, ranked by fit. Match a posting
 * to rank against everything it asks for, or browse by role.
 *
 * No phone number and no distance on any card — see SearchDtos.CandidateResult.
 */
export default function FindStaff() {
  const { t, tx } = useT();
  const { gutter } = useResponsive();
  const { restaurantId } = useSession();
  const outlets = useOutlets(restaurantId).data ?? [];
  const jobs = (useRestaurantJobs(restaurantId).data ?? []).filter((j) => j.status === 'OPEN');
  const roles = useRoles().data ?? [];

  const [jobId, setJobId] = useState<number | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [minExp, setMinExp] = useState<number | null>(null);
  const [localityId, setLocalityId] = useState<number | null>(null);
  const [maxSalary, setMaxSalary] = useState<number | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [picker, setPicker] = useState<'job' | 'role' | 'exp' | 'area' | 'pay' | 'join' | 'skills' | null>(null);
  const skills = useSkills().data ?? [];
  const [selected, setSelected] = useState<CandidateResult | null>(null);
  const [contactFor, setContactFor] = useState<CandidateResult | null>(null);

  // Ranking needs something to rank against. Default to the newest open job the
  // first time jobs load, so the first screen a restaurant sees is useful rather
  // than a list where every candidate ties.
  const [defaulted, setDefaulted] = useState(false);
  useEffect(() => {
    if (!defaulted && jobs.length > 0) {
      setJobId(jobs[0]!.id);
      setDefaulted(true);
    }
  }, [jobs.length, defaulted]);

  const cityId = outlets[0]?.cityId;
  const ranked = jobId != null || roleId != null;
  const params = useMemo(
    () => ({
      jobId: jobId ?? undefined,
      cityId: jobId ? undefined : cityId,
      roleId: roleId ?? undefined,
      minExperienceMonths: minExp ?? undefined,
      localityId: localityId ?? undefined,
      maxExpectedSalary: maxSalary ?? undefined,
      availability: availability ?? undefined,
      skillIds: skillIds.length ? skillIds : undefined,
    }),
    [jobId, cityId, roleId, minExp, localityId, maxSalary, availability, skillIds],
  );

  const query = useInfiniteQuery({
    queryKey: keys.candidates(restaurantId ?? 0, params),
    queryFn: ({ pageParam }) => api.restaurants.candidates(restaurantId!, params, pageParam),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.hasMore ? last.nextOffset : null),
    enabled: restaurantId != null && (jobId != null || cityId != null),
  });
  const candidates = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);

  const job = jobs.find((j) => j.id === jobId);
  const role = roles.find((r) => r.id === roleId);
  const localities = useLocalities(job?.cityId ?? cityId).data ?? [];
  const area = localities.find((l) => l.id === localityId);

  // "No candidates match yet; try widening your filters", as one tap each: every
  // active filter offers the next step looser, not only "remove".
  const widen: { key: string; label: string; apply: () => void }[] = [];
  if (minExp != null) {
    const lower = [...EXPERIENCE_MINIMUMS].reverse().find((m) => m < minExp && m > 0);
    widen.push(lower != null
      ? { key: 'exp', label: t('staff.widen.experience', { value: experience(lower) }), apply: () => setMinExp(lower) }
      : { key: 'exp', label: t('staff.widen.anyExperience'), apply: () => setMinExp(null) });
  }
  if (maxSalary != null) {
    const higher = MAX_EXPECTED_SALARIES.find((v) => v > maxSalary);
    widen.push(higher != null
      ? { key: 'pay', label: t('staff.payUpTo', { amount: rupeesShort(higher) }), apply: () => setMaxSalary(higher) }
      : { key: 'pay', label: t('staff.widen.anyPay'), apply: () => setMaxSalary(null) });
  }
  if (localityId != null) widen.push({ key: 'area', label: t('staff.widen.anyArea'), apply: () => setLocalityId(null) });
  if (availability != null) widen.push({ key: 'join', label: t('staff.widen.anyJoining'), apply: () => setAvailability(null) });
  if (skillIds.length) widen.push({ key: 'skills', label: t('staff.widen.anySkills'), apply: () => setSkillIds([]) });
  if (roleId != null) widen.push({ key: 'role', label: t('staff.widen.anyRole'), apply: () => setRoleId(null) });
  if (jobId != null && widen.length === 0) widen.push({ key: 'job', label: t('staff.widen.withoutJob'), apply: () => { setJobId(null); setDefaulted(true); } });

  return (
    <SafeAreaView edges={['top']} style={styles.fill}>
      <FlatList
        data={candidates}
        keyExtractor={(c) => String(c.employeeId)}
        contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: Spacing.section, gap: Spacing.md }}
        ListHeaderComponent={
          <View>
            <LargeTitle title={t('staff.title')} subtitle={t('staff.subtitle')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: Spacing.sm, paddingBottom: Spacing.md }}>
              <Chip label={job?.title ?? t('staff.forJob')} icon="briefcase-outline" selected={jobId != null} onPress={() => setPicker('job')} onRemove={jobId != null ? () => { setJobId(null); setDefaulted(true); } : undefined} />
              <Chip label={role?.nameDisplay ?? t('staff.role')} icon="restaurant-outline" selected={roleId != null} onPress={() => setPicker('role')} onRemove={roleId != null ? () => setRoleId(null) : undefined} />
              <Chip
                label={minExp != null ? t('format.minExperience', { value: experience(minExp) }) : t('staff.experience')}
                icon="ribbon-outline"
                selected={minExp != null}
                onPress={() => setPicker('exp')}
                onRemove={minExp != null ? () => setMinExp(null) : undefined}
              />
              <Chip label={area?.nameDisplay ?? t('staff.area')} icon="location-outline" selected={localityId != null} onPress={() => setPicker('area')} onRemove={localityId != null ? () => setLocalityId(null) : undefined} />
              <Chip label={maxSalary != null ? t('staff.payUpTo', { amount: rupeesShort(maxSalary) }) : t('staff.pay')} icon="cash-outline" selected={maxSalary != null} onPress={() => setPicker('pay')} onRemove={maxSalary != null ? () => setMaxSalary(null) : undefined} />
              <Chip label={availability ? t(`availability.${availability}` as MessageKey) : t('staff.canJoin')} icon="flash-outline" selected={availability != null} onPress={() => setPicker('join')} onRemove={availability ? () => setAvailability(null) : undefined} />
              <Chip label={skillIds.length ? t('search.skillsCount', { count: skillIds.length }) : t('search.skills')} icon="sparkles-outline" selected={skillIds.length > 0} onPress={() => setPicker('skills')} onRemove={skillIds.length ? () => setSkillIds([]) : undefined} />
            </ScrollView>
          </View>
        }
        renderItem={({ item }) => <CandidateCard candidate={item} ranked={ranked} onPress={() => setSelected(item)} onContact={() => setContactFor(item)} />}
        ListEmptyComponent={
          outlets.length === 0 && !query.isLoading ? (
            <EmptyState icon="storefront-outline" title={t('staff.noOutlet')} />
          ) : query.isLoading ? (
            <SkeletonList rows={4} />
          ) : query.isError ? (
            <ErrorView error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <View>
              <EmptyState icon="people-outline" title={t('staff.empty.title')} subtitle={widen.length ? t('staff.empty.widen') : t('staff.empty.body')} />
              {widen.length > 0 && (
                <View style={styles.widen}>
                  {widen.map((w) => (
                    <Chip key={w.key} label={w.label} icon="expand-outline" onPress={w.apply} />
                  ))}
                </View>
              )}
            </View>
          )
        }
        onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
        ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={Colors.primary} /> : null}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}
      />

      <SelectSheet
        visible={picker === 'job'}
        onClose={() => setPicker(null)}
        title={t('staff.forJob')}
        searchable={false}
        options={jobs.map((j) => ({ value: j.id, label: j.title, description: j.outletName ?? undefined }))}
        value={jobId}
        onChange={(v) => { setJobId(v); setDefaulted(true); setPicker(null); }}
      />
      <SelectSheet
        visible={picker === 'role'}
        onClose={() => setPicker(null)}
        title={t('staff.role')}
        options={roles.map((r) => ({ value: r.id, label: r.nameDisplay, group: t(`roleCategory.${r.category}` as MessageKey) }))}
        value={roleId}
        onChange={(v) => { setRoleId(v); setPicker(null); }}
      />
      <SelectSheet
        visible={picker === 'exp'}
        onClose={() => setPicker(null)}
        title={t('staff.experience')}
        searchable={false}
        options={EXPERIENCE_MINIMUMS.filter((m) => m > 0).map((m) => ({ value: m, label: t('format.minExperience', { value: experience(m) }) }))}
        value={minExp}
        onChange={(v) => { setMinExp(v); setPicker(null); }}
      />

      <SelectSheet
        visible={picker === 'area'}
        onClose={() => setPicker(null)}
        title={t('staff.area')}
        options={localities.map((l) => ({ value: l.id, label: l.nameDisplay }))}
        value={localityId}
        onChange={(v) => { setLocalityId(v); setPicker(null); }}
      />
      <SelectSheet
        visible={picker === 'pay'}
        onClose={() => setPicker(null)}
        title={t('staff.pay')}
        searchable={false}
        options={MAX_EXPECTED_SALARIES.map((v) => ({ value: v, label: t('staff.payUpTo', { amount: rupeesShort(v) }) }))}
        value={maxSalary}
        onChange={(v) => { setMaxSalary(v); setPicker(null); }}
      />
      <SelectSheet
        visible={picker === 'join'}
        onClose={() => setPicker(null)}
        title={t('staff.canJoin')}
        searchable={false}
        options={LOOKING.map((a) => ({ value: a, label: t(`availability.${a}` as MessageKey) }))}
        value={availability}
        onChange={(v) => { setAvailability(v); setPicker(null); }}
      />
      <SelectSheet
        visible={picker === 'skills'}
        onClose={() => setPicker(null)}
        title={t('search.skills')}
        multiple
        options={[...skills]
          .sort((a, b) => rank(a.category) - rank(b.category) || a.nameDisplay.localeCompare(b.nameDisplay))
          .map((s) => ({ value: s.id, label: s.nameDisplay, group: tx(`skills.category.${s.category ?? 'Other'}`, s.category ?? '') }))}
        value={skillIds}
        onChange={setSkillIds}
      />

      <Sheet
        visible={selected != null}
        onClose={() => setSelected(null)}
        title={selected?.name ?? ''}
        subtitle={selected?.primaryRoleDisplay ?? undefined}
        footer={
          <Button
            label={t('contact.show')}
            icon="call"
            size="lg"
            fullWidth
            onPress={() => {
              setContactFor(selected);
              setSelected(null);
            }}
          />
        }
      >
        {selected != null && <CandidateDetail candidate={selected} />}
      </Sheet>

      <ContactSheet
        visible={contactFor != null}
        onClose={() => setContactFor(null)}
        restaurantId={restaurantId}
        employeeId={contactFor?.employeeId ?? null}
        name={contactFor?.name}
      />
    </SafeAreaView>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? Colors.accent : score >= 50 ? Colors.warning : Colors.textTertiary;
  return (
    <View style={[styles.ring, { borderColor: color }]}>
      <Txt variant="captionStrong" color={color}>
        {score}
      </Txt>
    </View>
  );
}

function CandidateCard({ candidate: c, onPress, onContact, ranked }: { candidate: CandidateResult; onPress: () => void; onContact: () => void; ranked: boolean }) {
  const { t } = useT();
  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={onPress} activeOpacity={PRESS_OPACITY} style={styles.cardTop} accessibilityRole="button" accessibilityLabel={c.name ?? undefined}>
        <Avatar name={c.name} uri={c.profilePhotoUrl} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt variant="subheading" numberOfLines={1}>
            {c.name}
          </Txt>
          <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
            {[c.primaryRoleDisplay, experience(c.totalExperienceMonths), c.localityDisplay].filter(Boolean).join(' · ')}
          </Txt>
        </View>
        {ranked ? <ScoreRing score={c.matchScore} /> : <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />}
      </TouchableOpacity>
      {/* Beside the card's own button, not inside it — the fast path the spec asks for. */}
      <View style={styles.cardBottom}>
        <Txt variant="caption" color={Colors.textTertiary} style={{ flex: 1 }} numberOfLines={1}>
          {[c.expectedSalary ? t('staff.expects', { amount: rupees(c.expectedSalary) }) : null, t(`availability.${c.availability}` as MessageKey)].filter(Boolean).join(' · ')}
        </Txt>
        <TouchableOpacity onPress={onContact} activeOpacity={PRESS_OPACITY} style={styles.contact} accessibilityRole="button" accessibilityLabel={t('contact.show')} hitSlop={8}>
          <Ionicons name="call" size={14} color={Colors.accentDark} />
          <Txt variant="captionStrong" color={Colors.accentDark}>
            {t('contact.short')}
          </Txt>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CandidateDetail({ candidate: c }: { candidate: CandidateResult }) {
  const { t } = useT();
  return (
    <View style={{ gap: Spacing.xl }}>
      <ListGroup>
        <ListRow icon="ribbon-outline" title={t('rapp.experience')} value={experience(c.totalExperienceMonths)} />
        <ListRow icon="cash-outline" title={t('rapp.expects')} value={c.expectedSalary ? rupees(c.expectedSalary) : t('common.notSet')} />
        <ListRow icon="flash-outline" title={t('rapp.canJoin')} value={t(`availability.${c.availability}` as MessageKey)} />
        <ListRow icon="location-outline" title={t('profile.livesIn')} value={c.localityDisplay ?? t('common.notSet')} />
      </ListGroup>
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md }}>
          <Txt variant="subheading">{t('staff.whyMatch')}</Txt>
          <Txt variant="subheading" color={Colors.accent}>
            {t('rapp.match', { score: c.matchScore })}
          </Txt>
        </View>
        <View style={{ gap: Spacing.md }}>
          {SIGNALS.filter((s) => c.matchSignals[s] != null).map((s) => (
            <ProgressBar key={s} value={c.matchSignals[s]!} label={t(`staff.signal.${s}` as MessageKey)} showValue threshold={50} />
          ))}
        </View>
      </View>
      <View style={styles.hint}>
        <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textSecondary} />
        <Txt variant="caption" color={Colors.textSecondary} style={{ flex: 1 }}>
          {t('staff.profileStrength', { percent: c.profileCompletionPercentage })}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusFull,
    backgroundColor: Colors.accentLight,
  },
  ring: { width: 46, height: 46, borderRadius: 23, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  widen: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, marginTop: -Spacing.xxl },
  hint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Spacing.radiusMd, backgroundColor: Colors.background },
});
