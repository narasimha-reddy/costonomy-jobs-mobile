import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { ProgressBar } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { LargeTitle, IconButton } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ListGroup, ListRow, Section, ToggleRow } from '@/components/app/Controls';
import { Tag } from '@/components/app/Pieces';
import { ErrorView, Loading } from '@/components/app/Feedback';
import { EditableAvatar } from '@/components/app/Media';
import { MyDocuments } from '@/components/app/MyDocuments';
import { useT, type MessageKey } from '@/lib/i18n';
import { api } from '@/lib/api';
import { experience, formatMobile, monthYear, rupees } from '@/lib/format';
import { upload } from '@/lib/media';
import { keys, useExperience, useMySkills, useProfile } from '@/lib/queries';
import { setRole, useSession } from '@/lib/session';

/** What restaurants see, with the gaps called out as a to-do list rather than an error. */
export default function Profile() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const { me } = useSession();
  const profileQuery = useProfile();
  const skills = useMySkills().data ?? [];
  const history = useExperience().data ?? [];
  const profile = profileQuery.data;

  const hasRestaurant = (me?.restaurantMemberships.length ?? 0) > 0;

  if (profileQuery.isLoading) return <Loading />;
  if (!profile) return <ErrorView error={profileQuery.error} onRetry={() => profileQuery.refetch()} />;

  const toggleVisibility = async (visible: boolean) => {
    await api.profile.update({ profileVisibility: visible ? 'VISIBLE' : 'HIDDEN' });
    await queryClient.invalidateQueries({ queryKey: keys.profile });
  };

  const missingRoute = (field: string) =>
    field === 'skills' ? '/profile/skills' : field === 'experience' ? '/profile/experience' : field === 'preferredLocations' ? '/profile/preferences' : '/profile/edit';

  return (
    <Screen tone="tinted" refreshing={profileQuery.isRefetching} onRefresh={() => profileQuery.refetch()}>
      <LargeTitle title={t('profile.title')} right={<IconButton icon="settings-outline" label={t('profile.settings')} onPress={() => router.push('/settings')} />} />

      <View style={styles.card}>
        <View style={styles.identity}>
          <EditableAvatar
            name={profile.name}
            uri={profile.profilePhotoUrl}
            onUpload={async (file) => {
              const token = await upload(file, api.profile.photoUpload);
              queryClient.setQueryData(keys.profile, await api.profile.setPhoto(token));
            }}
            onRemove={async () => {
              queryClient.setQueryData(keys.profile, await api.profile.removePhoto());
            }}
          />
          {/* The name block is its own button, beside the avatar's rather than around it. */}
          <TouchableOpacity onPress={() => router.push('/profile/edit')} activeOpacity={PRESS_OPACITY} style={styles.identityText} accessibilityRole="button">
            <View style={{ flex: 1 }}>
              <Txt variant="title">{profile.name ?? t('common.notSet')}</Txt>
              <Txt variant="body" color={Colors.textSecondary}>
                {[profile.primaryRoleDisplay, experience(profile.totalExperienceMonths)].filter(Boolean).join(' · ')}
              </Txt>
              <Txt variant="caption" color={Colors.textTertiary}>
                {formatMobile(profile.mobileNumber)}
              </Txt>
            </View>
            <Ionicons name="create-outline" size={22} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.strength}>
          <ProgressBar value={profile.profileCompletionPercentage} label={t('profile.strength')} showValue threshold={40} />
          {profile.missingFields.length > 0 && (
            <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
              {profile.missingFields.slice(0, 3).map((field) => (
                <TouchableOpacity key={field} onPress={() => router.push(missingRoute(field))} style={styles.missing} accessibilityRole="button">
                  <Ionicons name="add-circle" size={18} color={Colors.primary} />
                  <Txt variant="captionStrong" color={Colors.primaryDark} style={{ flex: 1 }}>
                    {t(`profile.missing.${field}` as MessageKey)}
                  </Txt>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <Section title={t('profile.about')}>
        <ListGroup>
          <ListRow icon="restaurant-outline" title={t('profile.role')} value={profile.primaryRoleDisplay ?? t('common.notSet')} onPress={() => router.push('/profile/edit')} />
          <ListRow icon="ribbon-outline" title={t('profile.experience')} value={experience(profile.totalExperienceMonths)} onPress={() => router.push('/profile/edit')} />
          <ListRow icon="cash-outline" title={t('profile.expectedSalary')} value={profile.expectedSalary ? rupees(profile.expectedSalary) : t('common.notSet')} onPress={() => router.push('/profile/edit')} />
          <ListRow icon="flash-outline" title={t('profile.availability')} value={t(`availability.${profile.availability}` as MessageKey)} onPress={() => router.push('/profile/edit')} />
          <ListRow icon="location-outline" title={t('profile.livesIn')} value={profile.currentLocalityDisplay ?? profile.currentCityDisplay ?? t('common.notSet')} onPress={() => router.push('/profile/edit')} />
        </ListGroup>
      </Section>

      <Section
        title={t('profile.skills')}
        action={
          <TouchableOpacity onPress={() => router.push('/profile/skills')} accessibilityRole="button">
            <Txt variant="captionStrong" color={Colors.primary}>
              {skills.length ? t('common.edit') : t('common.add')}
            </Txt>
          </TouchableOpacity>
        }
      >
        {skills.length ? (
          <View style={styles.tags}>
            {skills.map((s) => (
              <Tag key={s.skillId} label={s.nameDisplay} tone={s.category === 'Cuisine' ? 'primary' : 'neutral'} />
            ))}
          </View>
        ) : (
          <ListGroup>
            <ListRow icon="add" iconColor={Colors.primary} title={t('profile.addSkills')} onPress={() => router.push('/profile/skills')} />
          </ListGroup>
        )}
      </Section>

      <MyDocuments />

      <Section title={t('profile.workHistory')}>
        <ListGroup>
          {history.slice(0, 3).map((h) => (
            <ListRow
              key={h.id}
              icon="business-outline"
              title={`${h.roleDisplay} · ${h.restaurantName ?? ''}`}
              subtitle={`${monthYear(h.startDate)} – ${h.current ? t('workHistory.present') : monthYear(h.endDate)}`}
            />
          ))}
          <ListRow icon="add" iconColor={Colors.primary} title={t('workHistory.add')} onPress={() => router.push('/profile/experience')} />
        </ListGroup>
      </Section>

      <Section>
        <ListGroup>
          <ListRow icon="options-outline" title={t('profile.preferences')} onPress={() => router.push('/profile/preferences')} />
          <ToggleRow title={t('profile.visibility')} subtitle={t('profile.visibilityHint')} value={profile.profileVisibility === 'VISIBLE'} onChange={toggleVisibility} />
        </ListGroup>
      </Section>

      <Section>
        <ListGroup>
          {hasRestaurant ? (
            <ListRow
              icon="swap-horizontal"
              iconColor={Colors.accent}
              title={t('profile.switchToHiring')}
              onPress={async () => {
                await setRole('restaurant');
                router.replace('/restaurant');
              }}
            />
          ) : (
            <ListRow icon="storefront-outline" iconColor={Colors.accent} title={t('profile.startHiring')} onPress={() => router.push('/onboarding/restaurant')} />
          )}
        </ListGroup>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Spacing.radiusXl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  identityText: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  strength: { marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  missing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.radiusMd,
    backgroundColor: Colors.primaryLight,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
});
