import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { ApplicationStatusBadge, Avatar, EmptyState, JobStatusBadge, SkeletonList } from '@/components/ui';
import { Header, IconButton } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ListGroup, ListRow } from '@/components/app/Controls';
import { Sheet } from '@/components/app/Sheet';
import { ConfirmSheet, ErrorView, errorMessage, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, type Application, type ApplicationStatusCode } from '@/lib/api';
import { experience, relativeTime, rupees, salaryRange } from '@/lib/format';
import { keys, useJob, useJobApplications, useRoleName } from '@/lib/queries';
import { useSession } from '@/lib/session';
import { useResponsive } from '@/hooks/useResponsive';
import { shareJob } from '@/lib/share';
import { Button } from '@/components/ui';

type Stage = 'new' | 'shortlisted' | 'interview' | 'offer' | 'hired' | 'closed';

const STAGES: { key: Stage; statuses: ApplicationStatusCode[] }[] = [
  { key: 'new', statuses: ['APPLIED', 'VIEWED'] },
  { key: 'shortlisted', statuses: ['SHORTLISTED'] },
  { key: 'interview', statuses: ['INTERVIEW'] },
  { key: 'offer', statuses: ['SELECTED', 'OFFERED', 'OFFER_ACCEPTED'] },
  { key: 'hired', statuses: ['JOINED'] },
  { key: 'closed', statuses: ['REJECTED', 'WITHDRAWN', 'DID_NOT_JOIN'] },
];

/**
 * One job's hiring pipeline. A kanban compressed for a phone: the stages are a
 * scrolling row of tabs with counts, and the list below is that column.
 */
export default function JobPipeline() {
  const { t } = useT();
  const { id, posted } = useLocalSearchParams<{ id: string; posted?: string }>();
  const jobId = Number(id);
  const [justPosted, setJustPosted] = useState(posted === '1');
  const { gutter } = useResponsive();
  const { restaurantId } = useSession();
  const queryClient = useQueryClient();
  const job = useJob(jobId);
  const applications = useJobApplications(jobId);
  const [stage, setStage] = useState<Stage>('new');
  const [menu, setMenu] = useState(false);
  const [closing, setClosing] = useState(false);

  const byStage = useMemo(() => {
    const all = applications.data ?? [];
    return Object.fromEntries(STAGES.map((s) => [s.key, all.filter((a) => s.statuses.includes(a.status))])) as Record<Stage, Application[]>;
  }, [applications.data]);

  const refresh = async () => {
    await Promise.all([job.refetch(), applications.refetch()]);
    void queryClient.invalidateQueries({ queryKey: keys.restaurantJobs(restaurantId ?? 0) });
    void queryClient.invalidateQueries({ queryKey: keys.funnel(jobId) });
  };

  const transition = async (action: 'publish' | 'pause' | 'resume' | 'close') => {
    setMenu(false);
    try {
      await api.jobs.transition(jobId, action);
      toast(t('pipeline.updated'));
      await refresh();
    } catch (e) {
      toast(errorMessage(e, t('common.errorBody')), 'error');
    }
  };

  const j = job.data;
  const total = applications.data?.length ?? 0;

  return (
    <SafeAreaView edges={['top']} style={styles.fill}>
      <Header right={j ? <IconButton icon="ellipsis-horizontal" label="Menu" onPress={() => setMenu(true)} /> : undefined} />
      {job.isError ? (
        <ErrorView error={job.error} onRetry={() => job.refetch()} />
      ) : (
        <FlatList
          data={byStage[stage] ?? []}
          keyExtractor={(a) => String(a.id)}
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: Spacing.section, gap: Spacing.md }}
          ListHeaderComponent={
            j ? (
              <View>
                {justPosted && j.status === 'OPEN' && (
                  <View style={styles.posted}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                      <Txt variant="subheading" style={{ flex: 1 }}>
                        {t('pipeline.posted.title')}
                      </Txt>
                      <IconButton icon="close" label={t('common.close')} color={Colors.textSecondary} onPress={() => setJustPosted(false)} />
                    </View>
                    <Txt variant="body" color={Colors.textSecondary}>
                      {t('pipeline.posted.body')}
                    </Txt>
                    <Button label={t('pipeline.share')} icon="share-social-outline" variant="secondary" onPress={() => void shareJob(j)} style={{ alignSelf: 'flex-start', marginTop: Spacing.sm }} />
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Txt variant="display">{j.title}</Txt>
                    <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: 4 }}>
                      {[j.outletName, salaryRange(j.minSalary, j.maxSalary, j.salaryPeriod)].filter(Boolean).join(' · ')}
                    </Txt>
                  </View>
                  <JobStatusBadge status={j.status} />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stages}>
                  {STAGES.map((s) => {
                    const on = s.key === stage;
                    const count = byStage[s.key]?.length ?? 0;
                    return (
                      <TouchableOpacity key={s.key} onPress={() => setStage(s.key)} activeOpacity={PRESS_OPACITY} style={[styles.stage, on && styles.stageOn]} accessibilityRole="tab" accessibilityState={{ selected: on }}>
                        <Txt variant="title" color={on ? Colors.white : Colors.textPrimary}>
                          {count}
                        </Txt>
                        <Txt variant="captionStrong" color={on ? Colors.white : Colors.textSecondary}>
                          {t(`pipeline.stage.${s.key}` as MessageKey)}
                        </Txt>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            ) : (
              <SkeletonList rows={1} />
            )
          }
          renderItem={({ item }) => <CandidateRow application={item} />}
          ListEmptyComponent={
            applications.isLoading ? (
              <SkeletonList rows={3} />
            ) : total === 0 ? (
              <EmptyState
                icon="people-outline"
                title={t('pipeline.noApplicants.title')}
                subtitle={t('pipeline.noApplicants.body')}
                actionLabel={t('pipeline.findStaff')}
                onAction={() => router.navigate('/restaurant/staff')}
              />
            ) : (
              <Txt variant="body" color={Colors.textTertiary} align="center" style={{ paddingVertical: Spacing.section }}>
                {t('pipeline.empty')}
              </Txt>
            )
          }
          refreshControl={<RefreshControl refreshing={applications.isRefetching} onRefresh={refresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Sheet visible={menu} onClose={() => setMenu(false)} title={j?.title}>
        <ListGroup>
          {j?.status === 'OPEN' && <ListRow icon="share-social-outline" title={t('pipeline.share')} onPress={() => { setMenu(false); void shareJob(j); }} />}
          <ListRow icon="create-outline" title={t('pipeline.edit')} onPress={() => { setMenu(false); router.push({ pathname: '/hiring/job-form', params: { id: String(jobId) } }); }} />
          {j?.status === 'DRAFT' && <ListRow icon="rocket-outline" iconColor={Colors.success} title={t('pipeline.publish')} onPress={() => transition('publish')} />}
          {j?.status === 'OPEN' && <ListRow icon="pause-circle-outline" title={t('pipeline.pause')} onPress={() => transition('pause')} />}
          {j?.status === 'PAUSED' && <ListRow icon="play-circle-outline" title={t('pipeline.resume')} onPress={() => transition('resume')} />}
          {(j?.status === 'OPEN' || j?.status === 'PAUSED') && (
            <ListRow icon="close-circle-outline" title={t('pipeline.close')} danger onPress={() => { setMenu(false); setClosing(true); }} />
          )}
        </ListGroup>
      </Sheet>

      <ConfirmSheet
        visible={closing}
        onClose={() => setClosing(false)}
        title={t('pipeline.close')}
        body={t('pipeline.close.confirm')}
        confirmLabel={t('pipeline.close')}
        danger
        onConfirm={() => transition('close')}
      />
    </SafeAreaView>
  );
}

function CandidateRow({ application: a }: { application: Application }) {
  const { t } = useT();
  const roleName = useRoleName();
  const c = a.candidate;
  return (
    <TouchableOpacity onPress={() => router.push(`/hiring/applications/${a.id}`)} activeOpacity={PRESS_OPACITY} style={styles.card} accessibilityRole="button">
      <Avatar name={a.candidateName} uri={a.candidate?.profilePhotoUrl} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <Txt variant="subheading" numberOfLines={1} style={{ flexShrink: 1 }}>
            {a.candidateName ?? t('common.deletedAccount')}
          </Txt>
          {a.status === 'APPLIED' && <View style={styles.newDot} />}
        </View>
        <Txt variant="caption" color={Colors.textSecondary} numberOfLines={1}>
          {[roleName(c?.primaryRoleId), experience(c?.totalExperienceMonths), c?.expectedSalary ? rupees(c.expectedSalary) : null].filter(Boolean).join(' · ')}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
          <ApplicationStatusBadge status={a.status} size="sm" />
          <Txt variant="caption" color={Colors.textTertiary}>
            {relativeTime(a.appliedAt)}
          </Txt>
        </View>
      </View>
      {a.matchScore != null ? (
        <View style={styles.score}>
          <Txt variant="captionStrong" color={a.matchScore >= 75 ? Colors.accentDark : Colors.textSecondary}>
            {t('rapp.match', { score: a.matchScore })}
          </Txt>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  posted: { gap: Spacing.xs, padding: Spacing.lg, marginBottom: Spacing.lg, borderRadius: Spacing.radiusLg, backgroundColor: Colors.successLight },
  fill: { flex: 1, backgroundColor: Colors.background },
  stages: { gap: Spacing.sm, paddingVertical: Spacing.xl },
  stage: {
    minWidth: 92,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  stageOn: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusLg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
  },
  newDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  score: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: Spacing.radiusFull, backgroundColor: Colors.accentLight },
});
