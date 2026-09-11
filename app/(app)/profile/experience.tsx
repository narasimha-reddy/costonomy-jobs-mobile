import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button, EmptyState, TextField } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ChipGroup, FieldLabel, SelectField, ToggleRow } from '@/components/app/Controls';
import { Sheet } from '@/components/app/Sheet';
import { ConfirmSheet, Loading, errorMessage } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api, type Experience } from '@/lib/api';
import { dayParts, experience } from '@/lib/format';
import { keys, useExperience, useRoles } from '@/lib/queries';

export default function WorkHistory() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const query = useExperience();
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Experience | null>(null);

  if (query.isLoading) return <Loading />;
  const items = query.data ?? [];

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: keys.experience });
    void queryClient.invalidateQueries({ queryKey: keys.profile });
  };

  return (
    <Screen
      header={<Header title={t('workHistory.title')} />}
      tone="tinted"
      footer={<Button label={t('workHistory.add')} size="lg" fullWidth icon="add" onPress={() => setAdding(true)} />}
    >
      {items.length === 0 ? (
        <EmptyState icon="business-outline" title={t('workHistory.empty.title')} subtitle={t('workHistory.empty.body')} />
      ) : (
        <View style={{ gap: Spacing.md, marginTop: Spacing.md }}>
          {items.map((h) => (
            <View key={h.id} style={styles.card}>
              <View style={styles.icon}>
                <Ionicons name="business" size={20} color={Colors.accent} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt variant="subheading">{h.roleDisplay}</Txt>
                <Txt variant="body" color={Colors.textSecondary}>
                  {h.restaurantName}
                </Txt>
                <Txt variant="caption" color={Colors.textTertiary}>
                  {h.startDate.slice(0, 7)} – {h.current ? t('workHistory.present') : (h.endDate ?? '').slice(0, 7)} · {experience(h.durationMonths)}
                </Txt>
              </View>
              <TouchableOpacity onPress={() => setRemoving(h)} accessibilityRole="button" accessibilityLabel={t('common.remove')} style={{ padding: Spacing.sm }}>
                <Ionicons name="trash-outline" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <AddExperienceSheet visible={adding} onClose={() => setAdding(false)} onSaved={refresh} />

      <ConfirmSheet
        visible={removing != null}
        onClose={() => setRemoving(null)}
        title={t('workHistory.removeConfirm')}
        body={removing ? `${removing.roleDisplay} · ${removing.restaurantName}` : undefined}
        confirmLabel={t('common.remove')}
        danger
        onConfirm={async () => {
          if (removing) await api.profile.deleteExperience(removing.id);
          await refresh();
        }}
      />
    </Screen>
  );
}

function AddExperienceSheet({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved: () => void }) {
  const { t } = useT();
  const roles = useRoles().data ?? [];
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => thisYear - i);
  const monthNames = Array.from({ length: 12 }, (_, i) => dayParts(new Date(2020, i, 1)).month);

  const [restaurant, setRestaurant] = useState('');
  const [roleId, setRoleId] = useState<number | null>(null);
  const [startYear, setStartYear] = useState<number | null>(null);
  const [startMonth, setStartMonth] = useState<number | null>(null);
  const [current, setCurrent] = useState(false);
  const [endYear, setEndYear] = useState<number | null>(null);
  const [endMonth, setEndMonth] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const valid = restaurant.trim() && roleId != null && startYear != null && startMonth != null && (current || (endYear != null && endMonth != null));
  const pad = (m: number) => String(m + 1).padStart(2, '0');

  const save = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await api.profile.addExperience({
        restaurantNameFreetext: restaurant.trim(),
        roleId: roleId!,
        startDate: `${startYear}-${pad(startMonth!)}-01`,
        endDate: current ? null : `${endYear}-${pad(endMonth!)}-01`,
      });
      onSaved();
      onClose();
      setRestaurant('');
      setRoleId(null);
      setStartYear(null);
      setStartMonth(null);
      setEndYear(null);
      setEndMonth(null);
      setCurrent(false);
    } catch (e) {
      setError(errorMessage(e, t('common.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  const monthOptions = monthNames.map((m, i) => ({ value: i, label: m }));
  const yearOptions = years.map((y) => ({ value: y, label: String(y) }));

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('workHistory.add')}
      tall
      footer={
        <View style={{ gap: Spacing.sm }}>
          {error != null && (
            <Txt variant="caption" color={Colors.danger} align="center">
              {error}
            </Txt>
          )}
          <Button label={t('common.save')} size="lg" fullWidth disabled={!valid} loading={busy} onPress={save} />
        </View>
      }
    >
      <View style={{ gap: Spacing.xl }}>
        <TextField label={t('workHistory.restaurant')} value={restaurant} onChangeText={setRestaurant} placeholder={t('workHistory.restaurantPlaceholder')} />
        <SelectField
          label={t('workHistory.role')}
          placeholder={t('jobForm.rolePlaceholder')}
          options={roles.map((r) => ({ value: r.id, label: r.nameDisplay, group: t(`roleCategory.${r.category}` as MessageKey) }))}
          value={roleId}
          onChange={setRoleId}
        />
        <View>
          <FieldLabel>{t('workHistory.started')}</FieldLabel>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <View style={{ flex: 1 }}>
              <SelectField placeholder={t('workHistory.month')} options={monthOptions} value={startMonth} onChange={setStartMonth} searchable={false} />
            </View>
            <View style={{ flex: 1 }}>
              <SelectField placeholder={t('workHistory.year')} options={yearOptions} value={startYear} onChange={setStartYear} searchable={false} />
            </View>
          </View>
        </View>
        <View style={styles.toggle}>
          <ToggleRow title={t('workHistory.current')} value={current} onChange={setCurrent} />
        </View>
        {!current && (
          <View>
            <FieldLabel>{t('workHistory.left')}</FieldLabel>
            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <SelectField placeholder={t('workHistory.month')} options={monthOptions} value={endMonth} onChange={setEndMonth} searchable={false} />
              </View>
              <View style={{ flex: 1 }}>
                <SelectField placeholder={t('workHistory.year')} options={yearOptions} value={endYear} onChange={setEndYear} searchable={false} />
              </View>
            </View>
          </View>
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
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  toggle: { borderRadius: Spacing.radiusLg, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' },
});
