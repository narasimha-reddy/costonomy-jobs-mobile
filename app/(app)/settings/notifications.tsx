import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Screen } from '@/components/app/Screen';
import { Header } from '@/components/app/Header';
import { Txt } from '@/components/app/Txt';
import { ListGroup, ListRow, Section, ToggleRow } from '@/components/app/Controls';
import { ErrorView, Loading, errorMessage, toast } from '@/components/app/Feedback';
import { useT } from '@/lib/i18n';
import { api, type NotificationSetting } from '@/lib/api';
import { keys } from '@/lib/queries';
import { useSession } from '@/lib/session';

/**
 * Push on or off per type. Only push: the in-app list always stays, because it is
 * the record of what happened to someone's application.
 */
export default function NotificationPreferences() {
  const { t, tx } = useT();
  const { role } = useSession();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: keys.notificationPrefs, queryFn: api.notifications.preferences });

  if (query.isLoading) return <Loading />;
  if (!query.data) return <ErrorView error={query.error} onRetry={() => query.refetch()} />;

  const audience = role === 'restaurant' ? 'RESTAURANT' : 'EMPLOYEE';
  const settings = query.data.filter((s) => s.audience === audience);

  const toggle = async (s: NotificationSetting, pushEnabled: boolean) => {
    // Optimistic: a switch that waits for the network before moving feels broken.
    queryClient.setQueryData<NotificationSetting[]>(keys.notificationPrefs, (old) =>
      old?.map((o) => (o.type === s.type ? { ...o, pushEnabled } : o)),
    );
    try {
      const next = await api.notifications.updatePreferences([{ type: s.type, pushEnabled }]);
      queryClient.setQueryData(keys.notificationPrefs, next);
    } catch (e) {
      toast(errorMessage(e, t('common.errorBody')), 'error');
      void query.refetch();
    }
  };

  return (
    <Screen header={<Header title={t('notifPrefs.title')} />} tone="tinted">
      <Txt variant="body" color={Colors.textSecondary} style={{ marginTop: Spacing.sm }}>
        {t('notifPrefs.subtitle')}
      </Txt>
      <Section>
        <ListGroup>
          {settings.map((s) =>
            s.pushConfigurable ? (
              <ToggleRow key={s.type} title={tx(`notificationType.${s.type}`, s.type)} value={s.pushEnabled} onChange={(v) => toggle(s, v)} />
            ) : (
              <ListRow key={s.type} title={tx(`notificationType.${s.type}`, s.type)} value={t('notifPrefs.inAppOnly')} />
            ),
          )}
        </ListGroup>
      </Section>
    </Screen>
  );
}
