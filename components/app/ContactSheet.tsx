import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { api, type CandidateContact } from '@/lib/api';
import { formatMobile } from '@/lib/format';
import { Txt } from './Txt';
import { Sheet } from './Sheet';
import { errorMessage } from './Feedback';

/**
 * "Contact": shows a candidate's number with Call and WhatsApp.
 *
 * The number is fetched only when the sheet opens — never with the list — because
 * every reveal is recorded and counts toward a daily limit. Closing and reopening
 * within the session reuses what was already fetched.
 */
export function ContactSheet({
  visible,
  onClose,
  restaurantId,
  employeeId,
  name,
}: {
  visible: boolean;
  onClose: () => void;
  restaurantId: number | null;
  employeeId: number | null;
  name?: string | null;
}) {
  const { t } = useT();
  const [contact, setContact] = useState<CandidateContact | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!visible || restaurantId == null || employeeId == null) return;
    if (contact?.employeeId === employeeId) return;
    let live = true;
    setContact(null);
    setError(undefined);
    api.restaurants
      .contact(restaurantId, employeeId)
      .then((c) => live && setContact(c))
      .catch((e) => live && setError(errorMessage(e, t('common.errorBody'))));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, restaurantId, employeeId]);

  const digits = contact?.mobileNumber.replace(/\D/g, '') ?? '';

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('contact.title', { name: contact?.name ?? name ?? '' })}
      footer={
        contact ? (
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button label={t('contact.whatsapp')} icon="logo-whatsapp" variant="secondary" size="lg" fullWidth onPress={() => void Linking.openURL(`https://wa.me/${digits}`)} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label={t('contact.call')} icon="call" size="lg" fullWidth onPress={() => void Linking.openURL(`tel:${contact.mobileNumber}`)} />
            </View>
          </View>
        ) : undefined
      }
    >
      {contact ? (
        <View style={styles.number}>
          <View style={styles.phoneIcon}>
            <Ionicons name="call" size={22} color={Colors.accentDark} />
          </View>
          <Txt variant="display" selectable accessibilityLabel={contact.mobileNumber}>
            {formatMobile(contact.mobileNumber)}
          </Txt>
        </View>
      ) : error ? (
        <Txt variant="body" color={Colors.danger} style={{ paddingVertical: Spacing.lg }}>
          {error}
        </Txt>
      ) : (
        <ActivityIndicator color={Colors.primary} style={{ paddingVertical: Spacing.xxl }} />
      )}
      <View style={styles.hint}>
        <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textSecondary} />
        <Txt variant="caption" color={Colors.textSecondary} style={{ flex: 1 }}>
          {t('contact.hint')}
        </Txt>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  number: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
  phoneIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: Spacing.md },
  hint: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, marginTop: Spacing.md, borderRadius: Spacing.radiusMd, backgroundColor: Colors.background },
});
