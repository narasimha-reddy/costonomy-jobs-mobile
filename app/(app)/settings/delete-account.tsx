import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Button } from '@/components/ui';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ConfirmSheet, toast } from '@/components/app/Feedback';
import { useT, type MessageKey } from '@/lib/i18n';
import { api } from '@/lib/api';
import { forgetDeletedAccount, useSession } from '@/lib/session';

/**
 * Account deletion, required by both app stores. Says plainly what happens now
 * and what happens in 30 days before asking, because for a candidate halfway
 * through a hire the consequences reach other people.
 */
export default function DeleteAccount() {
  const { t } = useT();
  const { me } = useSession();
  const [confirming, setConfirming] = useState(false);
  const runsRestaurant = (me?.restaurantMemberships.length ?? 0) > 0;

  const now: MessageKey[] = ['deleteAccount.signedOut', 'deleteAccount.hiring', 'deleteAccount.search'];
  if (runsRestaurant) now.push('deleteAccount.restaurant');

  return (
    <Screen
      header={<Header title={t('deleteAccount.title')} />}
      footer={<Button label={t('deleteAccount.button')} variant="danger" size="lg" fullWidth onPress={() => setConfirming(true)} />}
    >
      <View style={styles.icon}>
        <Ionicons name="warning-outline" size={28} color={Colors.danger} />
      </View>
      <Txt variant="display" style={{ marginTop: Spacing.lg }}>
        {t('deleteAccount.heading')}
      </Txt>
      <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.xs }}>
        {t('deleteAccount.intro')}
      </Txt>

      <Group title={t('deleteAccount.now')} items={now.map((k) => t(k))} />
      <Group title={t('deleteAccount.later')} items={[t('deleteAccount.erased')]} />

      <View style={styles.restore}>
        <Ionicons name="time-outline" size={18} color={Colors.textSecondary} />
        <Txt variant="caption" color={Colors.textSecondary} style={{ flex: 1 }}>
          {t('deleteAccount.restore')}
        </Txt>
      </View>

      <ConfirmSheet
        visible={confirming}
        onClose={() => setConfirming(false)}
        title={t('deleteAccount.confirm')}
        body={t('deleteAccount.confirmBody')}
        confirmLabel={t('deleteAccount.button')}
        danger
        reasonPlaceholder={t('deleteAccount.reason')}
        onConfirm={async (reason) => {
          // Throws on refusal (the only owner of a restaurant with a team); the
          // sheet shows the server's message, which says what to do instead.
          await api.me.deleteAccount(reason);
          toast(t('deleteAccount.done'));
          await forgetDeletedAccount();
        }}
      />
    </Screen>
  );
}

function Group({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={{ marginTop: Spacing.xxl }}>
      <Txt variant="captionStrong" color={Colors.textSecondary} style={{ marginBottom: Spacing.sm }}>
        {title}
      </Txt>
      <View style={styles.panel}>
        {items.map((item, i) => (
          <View key={i} style={[styles.item, i > 0 && styles.divider]}>
            <View style={styles.dot} />
            <Txt variant="body" style={{ flex: 1 }}>
              {item}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  icon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.dangerLight, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg },
  panel: { borderRadius: Spacing.radiusLg, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight },
  item: { flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textTertiary, marginTop: 9 },
  restore: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xl, padding: Spacing.md, borderRadius: Spacing.radiusMd, backgroundColor: Colors.surfaceSunken },
});
