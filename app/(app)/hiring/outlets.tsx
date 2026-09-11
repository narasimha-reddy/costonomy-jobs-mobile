import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { PRESS_OPACITY } from '@/constants/motion';
import { Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { FieldLabel, SelectField } from '@/components/app/Controls';
import { Tag } from '@/components/app/Pieces';
import { Sheet } from '@/components/app/Sheet';
import { Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api, type Outlet } from '@/lib/api';
import { DEFAULT_CITY_ID } from '@/lib/config';
import { readLocationOnce } from '@/lib/location';
import { keys, useLocalities, useOutlets } from '@/lib/queries';
import { useSession } from '@/lib/session';

/** Outlets, and — the part that matters for check-in — whether each one's location is pinned. */
export default function Outlets() {
  const { t } = useT();
  const { restaurantId } = useSession();
  const query = useOutlets(restaurantId);
  const [editing, setEditing] = useState<Outlet | 'new' | null>(null);

  if (query.isLoading) return <Loading />;

  return (
    <Screen
      header={<Header title={t('outlets.title')} />}
      tone="tinted"
      footer={<Button label={t('outlets.add')} size="lg" fullWidth icon="add" onPress={() => setEditing('new')} />}
    >
      <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
        {(query.data ?? []).map((o) => (
          <TouchableOpacity key={o.id} onPress={() => setEditing(o)} activeOpacity={PRESS_OPACITY} style={styles.card} accessibilityRole="button">
            <View style={[styles.icon, { backgroundColor: o.checkInReady ? Colors.successLight : Colors.warningLight }]}>
              <Ionicons name="location" size={20} color={o.checkInReady ? Colors.success : Colors.warning} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt variant="subheading">{o.name}</Txt>
              <Txt variant="caption" color={Colors.textSecondary}>
                {[o.address, o.localityDisplay, o.cityDisplay].filter(Boolean).join(', ')}
              </Txt>
              <View style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                <Tag label={o.checkInReady ? t('outlets.checkInReady') : t('outlets.noPin')} tone={o.checkInReady ? 'accent' : 'neutral'} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </View>

      <OutletSheet
        outlet={editing === 'new' ? null : editing}
        visible={editing != null}
        onClose={() => setEditing(null)}
        restaurantId={restaurantId!}
      />
    </Screen>
  );
}

function OutletSheet({ outlet, visible, onClose, restaurantId }: { outlet: Outlet | null; visible: boolean; onClose: () => void; restaurantId: number }) {
  const { t } = useT();
  const queryClient = useQueryClient();
  const localities = useLocalities(DEFAULT_CITY_ID).data ?? [];
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [localityId, setLocalityId] = useState<number | null>(null);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pinning, setPinning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!visible) return;
    setName(outlet?.name ?? '');
    setAddress(outlet?.address ?? '');
    setLocalityId(outlet?.localityId ?? null);
    setPin(outlet?.latitude != null && outlet.longitude != null ? { latitude: outlet.latitude, longitude: outlet.longitude } : null);
    setError(undefined);
  }, [visible, outlet?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const pinHere = async () => {
    setPinning(true);
    const { fix } = await readLocationOnce();
    setPinning(false);
    if (fix) setPin({ latitude: Number(fix.latitude.toFixed(7)), longitude: Number(fix.longitude.toFixed(7)) });
    else setError(t('onboardR.pinFailed'));
  };

  const save = async () => {
    setBusy(true);
    setError(undefined);
    const body = {
      name: name.trim(),
      address: address.trim() || null,
      cityId: outlet?.cityId ?? DEFAULT_CITY_ID,
      localityId,
      latitude: pin?.latitude ?? null,
      longitude: pin?.longitude ?? null,
    };
    try {
      if (outlet) await api.restaurants.updateOutlet(outlet.id, body);
      else await api.restaurants.addOutlet(restaurantId, body);
      await queryClient.invalidateQueries({ queryKey: keys.outlets(restaurantId) });
      toast(t('outlets.saved'));
      onClose();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={outlet ? t('outlets.edit') : t('outlets.add')}
      footer={<Button label={t('common.save')} size="lg" fullWidth disabled={name.trim().length < 2} loading={busy} onPress={save} />}
    >
      <View style={{ gap: Spacing.xl }}>
        <TextField label={t('onboardR.outletName')} value={name} onChangeText={setName} placeholder={t('onboardR.outletNamePlaceholder')} />
        <SelectField label={t('onboardR.area')} placeholder={t('search.area')} options={localities.map((l) => ({ value: l.id, label: l.nameDisplay }))} value={localityId} onChange={setLocalityId} />
        <TextField label={t('onboardR.address')} value={address} onChangeText={setAddress} placeholder={t('onboardR.addressPlaceholder')} />
        <View>
          <FieldLabel hint={t('onboardR.pinHint')}>{t('onboardR.pin')}</FieldLabel>
          <Button
            label={pin ? `${t('onboardR.pinned')} · ${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}` : t('onboardR.pin')}
            variant="secondary"
            icon={pin ? 'checkmark-circle' : 'locate'}
            fullWidth
            loading={pinning}
            onPress={pinHere}
          />
        </View>
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
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
