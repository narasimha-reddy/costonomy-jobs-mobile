import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ChipGroup, FieldLabel } from '@/components/app/Controls';
import { Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api } from '@/lib/api';
import { RESTAURANT_TYPES } from '@/lib/options';
import { keys, useRestaurants } from '@/lib/queries';
import { refreshMe, useSession } from '@/lib/session';

export default function RestaurantProfile() {
  const { t } = useT();
  const { restaurantId } = useSession();
  const queryClient = useQueryClient();
  const restaurant = useRestaurants().data?.find((r) => r.id === restaurantId);
  const [name, setName] = useState('');
  const [type, setType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!restaurant) return;
    setName(restaurant.name);
    setType(restaurant.restaurantType);
    setDescription(restaurant.description ?? '');
  }, [restaurant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!restaurant) return <Loading />;

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await api.restaurants.update(restaurant.id, { name: name.trim(), restaurantType: type, description: description.trim() || null });
      await queryClient.invalidateQueries({ queryKey: keys.restaurants });
      void refreshMe();
      toast(t('rprofile.saved'));
      router.back();
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<Header title={t('rprofile.title')} />}
      footer={
        <View style={{ gap: Spacing.sm }}>
          {error != null && (
            <Txt variant="caption" color={Colors.danger} align="center">
              {error}
            </Txt>
          )}
          <Button label={t('common.saveChanges')} size="lg" fullWidth disabled={name.trim().length < 2} loading={busy} onPress={save} />
        </View>
      }
    >
      <View style={{ gap: Spacing.xxl, marginTop: Spacing.md }}>
        <TextField label={t('rprofile.name')} value={name} onChangeText={setName} />
        <View>
          <FieldLabel>{t('rprofile.type')}</FieldLabel>
          <ChipGroup options={RESTAURANT_TYPES.map((r) => ({ value: r.value, label: t(r.key) }))} value={type} onChange={setType} allowDeselect />
        </View>
        <TextField label={t('rprofile.description')} value={description} onChangeText={setDescription} placeholder={t('rprofile.descriptionPlaceholder')} multiline maxLength={2000} />
      </View>
    </Screen>
  );
}
