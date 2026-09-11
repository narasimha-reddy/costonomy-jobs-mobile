import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Avatar, Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ChipGroup, FieldLabel, Segmented } from '@/components/app/Controls';
import { Tag } from '@/components/app/Pieces';
import { Sheet } from '@/components/app/Sheet';
import { ConfirmSheet, Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, type RestaurantRole, type TeamMember } from '@/lib/api';
import { formatMobile } from '@/lib/format';
import { keys, useOutlets, useTeam } from '@/lib/queries';
import { useSession } from '@/lib/session';

export default function Team() {
  const { t } = useT();
  const { me, restaurantId } = useSession();
  const queryClient = useQueryClient();
  const query = useTeam(restaurantId);
  const outlets = useOutlets(restaurantId).data ?? [];
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);

  if (query.isLoading) return <Loading />;

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
              {!isMe && m.role !== 'OWNER' && (
                <TouchableOpacity onPress={() => setRemoving(m)} accessibilityRole="button" accessibilityLabel={t('team.remove')} style={{ padding: Spacing.sm }}>
                  <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <InviteSheet visible={inviting} onClose={() => setInviting(false)} restaurantId={restaurantId!} />

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
