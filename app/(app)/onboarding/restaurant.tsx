import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, ProgressBar, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ChipGroup, FieldLabel } from '@/components/app/Controls';
import { errorMessage } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { RESTAURANT_TYPES } from '@/lib/options';
import { api } from '@/lib/api';
import { DEFAULT_CITY_ID } from '@/lib/config';
import { readLocationOnce } from '@/lib/location';
import { keys, useLocalities } from '@/lib/queries';
import { refreshMe, setRole, useSession } from '@/lib/session';


/** A restaurant and its first outlet, created together so nobody is left owning a restaurant with nowhere to hire for. */
export default function RestaurantOnboarding() {
  const { t } = useT();
  const { me } = useSession();
  const queryClient = useQueryClient();
  const localities = useLocalities(DEFAULT_CITY_ID).data ?? [];

  const [step, setStep] = useState<1 | 2>(1);
  const [ownerName, setOwnerName] = useState(me?.user.name ?? '');
  const [name, setName] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [outletName, setOutletName] = useState('');
  const [address, setAddress] = useState('');
  const [localityId, setLocalityId] = useState<number | null>(null);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [pinning, setPinning] = useState(false);
  const [pinError, setPinError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const valid = step === 1 ? name.trim().length > 1 && ownerName.trim().length > 1 : outletName.trim().length > 1 && localityId != null;

  const pinLocation = async () => {
    setPinning(true);
    setPinError(undefined);
    const { fix } = await readLocationOnce();
    setPinning(false);
    if (fix) setPin({ latitude: Number(fix.latitude.toFixed(7)), longitude: Number(fix.longitude.toFixed(7)) });
    else setPinError(t('onboardR.pinFailed'));
  };

  const finish = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (ownerName.trim() && ownerName.trim() !== me?.user.name) {
        await api.me.update({ name: ownerName.trim() });
      }
      const restaurant = await api.restaurants.create({
        name: name.trim(),
        restaurantType: type,
        firstOutlet: {
          name: outletName.trim(),
          address: address.trim() || null,
          cityId: DEFAULT_CITY_ID,
          localityId,
          latitude: pin?.latitude ?? null,
          longitude: pin?.longitude ?? null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: keys.restaurants });
      await refreshMe();
      await setRole('restaurant', restaurant.id);
      router.replace('/restaurant');
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={
        <View>
          <Header onBack={() => (step === 2 ? setStep(1) : router.back())} />
          <View style={styles.progress}>
            <ProgressBar value={step * 50} showValue={false} />
            <Txt variant="caption" color={Colors.textSecondary} style={{ marginTop: 6 }}>
              {t('onboard.step', { current: step, total: 2 })}
            </Txt>
          </View>
        </View>
      }
      footer={
        <View style={{ gap: Spacing.sm }}>
          {error != null && (
            <Txt variant="caption" color={Colors.danger} align="center">
              {error}
            </Txt>
          )}
          <Button
            label={step === 1 ? t('common.continue') : t('onboardR.finish')}
            size="lg"
            fullWidth
            disabled={!valid}
            loading={busy}
            onPress={() => (step === 1 ? setStep(2) : finish())}
          />
        </View>
      }
    >
      {step === 1 ? (
        <View>
          <Txt variant="display" style={{ marginTop: Spacing.lg }}>
            {t('onboardR.restaurant.title')}
          </Txt>
          <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.xs, marginBottom: Spacing.xxl }}>
            {t('onboardR.restaurant.subtitle')}
          </Txt>
          <View style={{ gap: Spacing.xl }}>
            <TextField label={t('onboardR.yourName')} value={ownerName} onChangeText={setOwnerName} autoCapitalize="words" />
            <TextField label={t('onboardR.name')} value={name} onChangeText={setName} placeholder={t('onboardR.namePlaceholder')} autoCapitalize="words" />
            <View>
              <FieldLabel>{t('onboardR.type')}</FieldLabel>
              <ChipGroup options={RESTAURANT_TYPES.map((r) => ({ value: r.value, label: t(r.key) }))} value={type} onChange={setType} allowDeselect />
            </View>
          </View>
        </View>
      ) : (
        <View>
          <Txt variant="display" style={{ marginTop: Spacing.lg }}>
            {t('onboardR.outlet.title')}
          </Txt>
          <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.xs, marginBottom: Spacing.xxl }}>
            {t('onboardR.outlet.subtitle')}
          </Txt>
          <View style={{ gap: Spacing.xl }}>
            <TextField label={t('onboardR.outletName')} value={outletName} onChangeText={setOutletName} placeholder={t('onboardR.outletNamePlaceholder')} />
            <View>
              <FieldLabel>{t('onboardR.area')}</FieldLabel>
              <ChipGroup options={localities.map((l) => ({ value: l.id, label: l.nameDisplay }))} value={localityId} onChange={setLocalityId} />
            </View>
            <TextField label={t('onboardR.address')} value={address} onChangeText={setAddress} placeholder={t('onboardR.addressPlaceholder')} />
            <View style={[styles.pinCard, pin != null && styles.pinDone]}>
              <Ionicons name={pin ? 'checkmark-circle' : 'location'} size={24} color={pin ? Colors.success : Colors.accent} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{pin ? t('onboardR.pinned') : t('onboardR.pin')}</Txt>
                <Txt variant="caption" color={Colors.textSecondary}>
                  {pinError ?? (pin ? `${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}` : t('onboardR.pinHint'))}
                </Txt>
              </View>
              <Button label={pin ? t('common.edit') : t('common.add')} variant="secondary" size="sm" loading={pinning} onPress={pinLocation} />
            </View>
          </View>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progress: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  pinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Spacing.radiusLg,
    backgroundColor: Colors.accentLight,
  },
  pinDone: { backgroundColor: Colors.successLight },
});
