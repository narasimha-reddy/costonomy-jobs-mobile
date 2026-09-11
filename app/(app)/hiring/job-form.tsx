import React, { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ChipGroup, FieldLabel, ListGroup, SelectField, Stepper, ToggleRow, Segmented } from '@/components/app/Controls';
import { AmountInput } from '@/components/app/Pieces';
import { Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, type EmploymentType, type JobInput, type JoiningRequirement, type Shift } from '@/lib/api';
import { experience } from '@/lib/format';
import { EXPERIENCE_MINIMUMS, JOINING, SHIFTS } from '@/lib/options';
import { keys, useManagedJob, useOutlets, useRoles, useSkills } from '@/lib/queries';
import { useSession } from '@/lib/session';

/**
 * Post a job in under a minute: what a candidate needs to decide is visible up
 * front, everything else sits behind "More details". Editing uses the same form.
 */
export default function JobForm() {
  const { t } = useT();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = id != null;
  const queryClient = useQueryClient();
  const { restaurantId } = useSession();
  const outlets = useOutlets(restaurantId).data ?? [];
  const roles = useRoles().data ?? [];
  const skills = useSkills().data ?? [];
  const existing = useManagedJob(Number(id ?? 0));

  // Creating: any number of outlets, one job each. Editing: the job's own outlet.
  const [outletIds, setOutletIds] = useState<number[]>([]);
  const outletId = outletIds[0] ?? null;
  const setOutletId = (id: number) => setOutletIds([id]);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [openings, setOpenings] = useState(1);
  const [minSalary, setMinSalary] = useState('');
  const [maxSalary, setMaxSalary] = useState('');
  const [expMin, setExpMin] = useState(0);
  const [joining, setJoining] = useState<JoiningRequirement>('IMMEDIATE');
  const [more, setMore] = useState(false);
  const [title, setTitle] = useState('');
  const [shift, setShift] = useState<Shift | null>(null);
  const [employmentType, setEmploymentType] = useState<EmploymentType>('FULL_TIME');
  const [meals, setMeals] = useState(false);
  const [stay, setStay] = useState(false);
  const [description, setDescription] = useState('');
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [busy, setBusy] = useState<'post' | 'draft' | null>(null);
  const [error, setError] = useState<string>();

  // One outlet is the common case: pick it, don't ask.
  useEffect(() => {
    if (!editing && outletIds.length === 0 && outlets.length === 1) setOutletId(outlets[0]!.id);
  }, [outlets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const j = existing.data;
    if (!editing || !j) return;
    setOutletId(j.outletId);
    setRoleId(j.roleId);
    setOpenings(j.openings);
    setMinSalary(j.minSalary ? String(j.minSalary) : '');
    setMaxSalary(j.maxSalary ? String(j.maxSalary) : '');
    setExpMin(j.experienceMinMonths ?? 0);
    setJoining(j.joiningRequirement);
    setTitle(j.title === j.roleDisplay ? '' : j.title);
    setShift(j.shift);
    setEmploymentType(j.employmentType);
    setMeals(j.mealsProvided);
    setStay(j.accommodationProvided);
    setDescription(j.description ?? '');
    setSkillIds(j.skills.map((s) => s.skillId));
    setMore(true);
  }, [existing.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const salaryError = minSalary && maxSalary && Number(maxSalary) < Number(minSalary) ? t('jobForm.salaryInvalid') : undefined;
  const isDraft = editing && existing.data?.status === 'DRAFT';
  const ready = outletId != null && roleId != null && Number(minSalary) > 0 && Number(maxSalary) > 0 && !salaryError;

  const skillOptions = useMemo(
    () => skills.map((s) => ({ value: s.id, label: s.nameDisplay, group: s.category ?? undefined })),
    [skills],
  );

  if (editing && existing.isLoading) return <Loading />;

  const submit = async (publish: boolean) => {
    if (outletId == null || roleId == null) return;
    setBusy(publish ? 'post' : 'draft');
    setError(undefined);
    const body: JobInput = {
      outletId,
      roleId,
      title: title.trim() || null,
      description: description.trim() || null,
      minSalary: minSalary ? Number(minSalary) : null,
      maxSalary: maxSalary ? Number(maxSalary) : null,
      salaryPeriod: 'MONTHLY',
      experienceMinMonths: expMin,
      openings,
      joiningRequirement: joining,
      employmentType,
      shift,
      mealsProvided: meals,
      accommodationProvided: stay,
      skillIds,
      publish: editing ? undefined : publish,
    };
    try {
      if (!editing && outletIds.length > 1) {
        const created = await api.jobs.createAtOutlets(outletIds, body, publish);
        await queryClient.invalidateQueries({ queryKey: keys.restaurantJobs(restaurantId ?? 0) });
        toast(publish ? t('jobForm.postedToOutlets', { count: created.length }) : t('jobForm.saved'));
        router.back();
        return;
      }
      let job = editing ? await api.jobs.update(Number(id), body) : await api.jobs.create(body);
      // A draft (a new one, or a reposted job) is posted from the same form.
      if (isDraft && publish) job = await api.jobs.transition(job.id, 'publish');
      await queryClient.invalidateQueries({ queryKey: keys.restaurantJobs(restaurantId ?? 0) });
      void queryClient.invalidateQueries({ queryKey: keys.job(job.id) });
      toast(publish && (!editing || isDraft) ? t('jobForm.posted') : t('jobForm.saved'));
      if (editing) router.back();
      else router.replace({ pathname: '/hiring/jobs/[id]', params: { id: String(job.id), ...(publish ? { posted: '1' } : {}) } });
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen
      header={<Header title={editing ? t('jobForm.editTitle') : t('jobForm.createTitle')} close={!editing} />}
      footer={
        <View style={{ gap: Spacing.sm }}>
          {error != null && (
            <Txt variant="caption" color={Colors.danger} align="center">
              {error}
            </Txt>
          )}
          <Button
            label={editing && !isDraft ? t('common.saveChanges') : outletIds.length > 1 ? t('jobForm.postToOutlets', { count: outletIds.length }) : t('jobForm.post')}
            size="lg"
            fullWidth
            disabled={!ready}
            loading={busy === 'post'}
            onPress={() => submit(true)}
          />
          {(!editing || isDraft) && (
            <Button label={t('jobForm.saveDraft')} variant="ghost" fullWidth disabled={outletId == null || roleId == null} loading={busy === 'draft'} onPress={() => submit(false)} style={{ alignSelf: 'center' }} />
          )}
        </View>
      }
    >
      <View style={{ gap: Spacing.xxl, marginTop: Spacing.md }}>
        {outlets.length > 1 && (
          <View>
            <FieldLabel hint={editing ? undefined : t('jobForm.outletsHint')}>{editing ? t('jobForm.outlet') : t('jobForm.outlets')}</FieldLabel>
            {editing ? (
              <ChipGroup options={outlets.map((o) => ({ value: o.id, label: o.name, icon: 'location-outline' as const }))} value={outletId} onChange={setOutletId} />
            ) : (
              <ChipGroup multiple options={outlets.map((o) => ({ value: o.id, label: o.name, icon: 'location-outline' as const }))} value={outletIds} onChange={setOutletIds} />
            )}
          </View>
        )}

        <SelectField
          label={t('jobForm.role')}
          placeholder={t('jobForm.rolePlaceholder')}
          icon="restaurant-outline"
          options={roles.map((r) => ({ value: r.id, label: r.nameDisplay, group: t(`roleCategory.${r.category}` as MessageKey) }))}
          value={roleId}
          onChange={setRoleId}
        />

        <View>
          <FieldLabel>{t('jobForm.salary')}</FieldLabel>
          <View style={{ flexDirection: 'row', gap: Spacing.md }}>
            <AmountInput label={t('jobForm.from')} value={minSalary} onChange={setMinSalary} placeholder="15000" />
            <AmountInput label={t('jobForm.to')} value={maxSalary} onChange={setMaxSalary} placeholder="20000" />
          </View>
          {salaryError != null && (
            <Txt variant="caption" color={Colors.danger} style={{ marginTop: 6 }}>
              {salaryError}
            </Txt>
          )}
        </View>

        <View>
          <FieldLabel>{t('jobForm.experience')}</FieldLabel>
          <ChipGroup
            options={EXPERIENCE_MINIMUMS.map((m) => ({ value: m, label: m === 0 ? t('format.fresher') : `${experience(m)}+` }))}
            value={expMin}
            onChange={setExpMin}
          />
        </View>

        <View>
          <FieldLabel>{t('jobForm.joining')}</FieldLabel>
          <ChipGroup options={JOINING.map((j) => ({ value: j, label: t(`joining.${j}` as MessageKey) }))} value={joining} onChange={setJoining} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="captionStrong">{t('jobForm.openings')}</Txt>
          <Stepper value={openings} onChange={setOpenings} min={1} max={50} />
        </View>

        <TouchableOpacity onPress={() => setMore(!more)} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm }}>
          <Txt variant="bodyStrong" color={Colors.primary}>
            {more ? t('jobForm.less') : t('jobForm.more')}
          </Txt>
          <Ionicons name={more ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {more && (
        <View style={{ gap: Spacing.xxl }}>
          <TextField label={t('jobForm.jobTitle')} hint={t('jobForm.jobTitleHint')} value={title} onChangeText={setTitle} maxLength={200} />
          <View>
            <FieldLabel>{t('jobForm.type')}</FieldLabel>
            <Segmented
              options={[
                { value: 'FULL_TIME', label: t('employment.FULL_TIME') },
                { value: 'PART_TIME', label: t('employment.PART_TIME') },
              ]}
              value={employmentType}
              onChange={setEmploymentType}
            />
          </View>
          <View>
            <FieldLabel>{t('jobForm.shift')}</FieldLabel>
            <ChipGroup options={SHIFTS.map((s) => ({ value: s, label: t(`shift.${s}` as MessageKey) }))} value={shift} onChange={setShift} allowDeselect />
          </View>
          <ListGroup>
            <ToggleRow title={t('jobForm.meals')} value={meals} onChange={setMeals} />
            <ToggleRow title={t('jobForm.accommodation')} value={stay} onChange={setStay} />
          </ListGroup>
          <SelectField label={t('jobForm.skills')} placeholder={t('common.optional')} multiple options={skillOptions} value={skillIds} onChange={setSkillIds} />
          <TextField label={t('jobForm.description')} value={description} onChangeText={setDescription} placeholder={t('jobForm.descriptionPlaceholder')} multiline maxLength={5000} />
        </View>
      )}
    </Screen>
  );
}
