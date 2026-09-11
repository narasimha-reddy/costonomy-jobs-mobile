import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { Avatar, Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ChipGroup, FieldLabel, OptionCard, Segmented } from '@/components/app/Controls';
import { Tag } from '@/components/app/Pieces';
import { Sheet } from '@/components/app/Sheet';
import { ConfirmSheet, Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, type RestaurantRole, type TeamMember } from '@/lib/api';
import { formatMobile } from '@/lib/format';
import { keys, useOutlets, useRestaurants, useTeam } from '@/lib/queries';
import { useSession } from '@/lib/session';

export default function Team() {
  const { t } = useT();
  const { me, restaurantId } = useSession();
  const queryClient = useQueryClient();
  const query = useTeam(restaurantId);
  const outlets = useOutlets(restaurantId).data ?? [];
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const myRole = useRestaurants().data?.find((r) => r.id === restaurantId)?.myRole;
  const iAmOwner = myRole === 'OWNER';

  if (query.isLoading) return <Loading />;

  const canEdit = (m: TeamMember) => m.userId !== me?.user.id && (m.role !== 'OWNER' || iAmOwner);
  const outletNames = (ids: number[]) => ids.map((id) => outlets.find((o) => o.id === id)?.name).filter(Boolean).join(', ');

  return (
    <Screen
      header={<Header title={t('team.title')} />}
      tone="tinted"
      footer={<Button label={t('team.invite')} size="lg" fullWidth icon="person-add" onPress={() => setInviting(true)} />}
    >
      <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
        {(query.data ?? []).map((m) => {
          const isMe = m.userId === me?.user.id;
          return (
            <View key={m.restaurantUserId} style={styles.card}>
              {/* Ownership is changed only by an owner, and nobody edits their own role here. */}
              <TouchableOpacity
                style={styles.cardMain}
                activeOpacity={PRESS_OPACITY}
                disabled={!canEdit(m)}
                onPress={() => setEditing(m)}
                accessibilityRole="button"
                accessibilityLabel={t('team.edit')}
              >
                <Avatar name={m.name ?? m.mobileNumber} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Txt variant="subheading">
                    {m.name ?? formatMobile(m.mobileNumber)}
                    {isMe ? ` · ${t('team.you')}` : ''}
                  </Txt>
                  <Txt variant="caption" color={Colors.textSecondary}>
                    {m.allOutlets ? t('team.allOutlets') : outletNames(m.outletIds)}
                  </Txt>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <Tag label={t(`restaurantRole.${m.role}` as MessageKey)} tone="accent" />
                    {m.pendingFirstSignIn && <Tag label={t('team.pending')} icon="time-outline" />}
                  </View>
                </View>
                {canEdit(m) && <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />}
              </TouchableOpacity>
              {!isMe && (m.role !== 'OWNER' || iAmOwner) && (
                <TouchableOpacity onPress={() => setRemoving(m)} accessibilityRole="button" accessibilityLabel={t('team.remove')} style={{ padding: Spacing.sm }}>
                  <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <InviteSheet visible={inviting} onClose={() => setInviting(false)} restaurantId={restaurantId!} />
      <EditMemberSheet member={editing} onClose={() => setEditing(null)} restaurantId={restaurantId!} canGrantOwner={iAmOwner} />

      <ConfirmSheet
        visible={removing != null}
        onClose={() => setRemoving(null)}
        title={t('team.remove.confirm', { name: removing?.name ?? removing?.mobileNumber ?? '' })}
        confirmLabel={t('team.remove')}
        danger
        onConfirm={async () => {
          if (removing) await api.restaurants.removeMember(restaurantId!, removing.restaurantUserId);
          await queryClient.invalidateQueries({ queryKey: keys.team(restaurantId!) });
          toast(t('team.removed'));
        }}
      />
    </Screen>
  );
}

function EditMemberSheet({
  member,
  onClose,
  restaurantId,
  canGrantOwner,
}: {
  member: TeamMember | null;
  onClose: () => void;
  restaurantId: number;
  canGrantOwner: boolean;
}) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const outlets = useOutlets(restaurantId).data ?? [];
  const [role, setRole] = useState<RestaurantRole>('HR_RECRUITER');
  const [outletIds, setOutletIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!member) return;
    setRole(member.role);
    setOutletIds(member.outletIds);
    setError(undefined);
  }, [member]);

  const valid = role !== 'OUTLET_MANAGER' || outletIds.length > 0;
  const roles: RestaurantRole[] = canGrantOwner ? ['OWNER', 'ADMIN', 'HR_RECRUITER', 'OUTLET_MANAGER'] : ['ADMIN', 'HR_RECRUITER', 'OUTLET_MANAGER'];

  const save = async () => {
    if (!member) return;
    setBusy(true);
    setError(undefined);
    try {
      await api.restaurants.updateMember(restaurantId, member.restaurantUserId, {
        role,
        outletIds: role === 'OUTLET_MANAGER' ? outletIds : [],
      });
      await queryClient.invalidateQueries({ queryKey: keys.team(restaurantId) });
      toast(t('team.updated'));
      onClose();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={member != null}
      onClose={onClose}
      title={member?.name ?? (member ? formatMobile(member.mobileNumber) : '')}
      footer={<Button label={t('common.save')} size="lg" fullWidth disabled={!valid} loading={busy} onPress={save} />}
    >
      <View style={{ gap: Spacing.sm }}>
        <FieldLabel>{t('team.role')}</FieldLabel>
        {roles.map((r) => (
          <OptionCard key={r} title={t(`restaurantRole.${r}` as MessageKey)} subtitle={t(`team.roleHint.${r}` as MessageKey)} selected={role === r} onPress={() => setRole(r)} />
        ))}
      </View>
      {role === 'OUTLET_MANAGER' && (
        <View style={{ marginTop: Spacing.xl }}>
          <FieldLabel>{t('team.outlets')}</FieldLabel>
          <ChipGroup multiple options={outlets.map((o) => ({ value: o.id, label: o.name }))} value={outletIds} onChange={setOutletIds} />
        </View>
      )}
      {error != null && (
        <Txt variant="caption" color={Colors.danger} style={{ marginTop: Spacing.md }}>
          {error}
        </Txt>
      )}
    </Sheet>
  );
}

function InviteSheet({ visible, onClose, restaurantId }: { visible: boolean; onClose: () => void; restaurantId: number }) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const outlets = useOutlets(restaurantId).data ?? [];
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Exclude<RestaurantRole, 'OWNER'>>('HR_RECRUITER');
  const [outletIds, setOutletIds] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const valid = /^[6-9]\d{9}$/.test(mobile) && (role !== 'OUTLET_MANAGER' || outletIds.length > 0);

  const invite = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await api.restaurants.invite(restaurantId, {
        mobileNumber: `+91${mobile}`,
        name: name.trim() || null,
        role,
        outletIds: role === 'OUTLET_MANAGER' ? outletIds : [],
      });
      await queryClient.invalidateQueries({ queryKey: keys.team(restaurantId) });
      toast(t('team.invited'));
      setMobile('');
      setName('');
      setOutletIds([]);
      onClose();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('team.invite')} footer={<Button label={t('team.invite')} size="lg" fullWidth disabled={!valid} loading={busy} onPress={invite} />}>
      <View style={{ gap: Spacing.xl }}>
        <TextField label={t('team.mobile')} prefix="+91" value={mobile} onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" maxLength={10} />
        <TextField label={t('team.name')} value={name} onChangeText={setName} autoCapitalize="words" />
        <View>
          <FieldLabel>{t('team.role')}</FieldLabel>
          <Segmented
            options={[
              { value: 'ADMIN', label: t('restaurantRole.ADMIN') },
              { value: 'HR_RECRUITER', label: t('restaurantRole.HR_RECRUITER') },
              { value: 'OUTLET_MANAGER', label: t('restaurantRole.OUTLET_MANAGER') },
            ]}
            value={role}
            onChange={setRole}
          />
        </View>
        {role === 'OUTLET_MANAGER' && (
          <View>
            <FieldLabel>{t('team.outlets')}</FieldLabel>
            <ChipGroup multiple options={outlets.map((o) => ({ value: o.id, label: o.name }))} value={outletIds} onChange={setOutletIds} />
          </View>
        )}
        {error != null && (
          <Txt variant="caption" color={Colors.danger}>
            {error}
          </Txt>
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  cardMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
