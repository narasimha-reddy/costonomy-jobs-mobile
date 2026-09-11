import React, { useState } from 'react';
import { View } from 'react-native';
import { Spacing } from '@/constants/spacing';
import { useT } from '@/lib/i18n';
import { useConversations } from '@/lib/queries';
import { Segmented } from './Controls';
import { ConversationList } from './ConversationList';
import { NotificationList } from './NotificationList';

/**
 * The Inbox tab: updates about hiring, and messages with the other side. One tab
 * rather than two, so the tab bar keeps four (or five) destinations a thumb can
 * find without looking.
 */
export function Inbox({ side }: { side: 'candidate' | 'restaurant' }) {
  const { t } = useT();
  const [tab, setTab] = useState<'updates' | 'messages'>('updates');
  const unreadThreads = (useConversations(side).data ?? []).filter((c) => c.unread).length;

  const header = (
    <View style={{ marginBottom: Spacing.sm }}>
      <Segmented
        options={[
          { value: 'updates', label: t('inbox.updates') },
          { value: 'messages', label: t('inbox.messages'), count: unreadThreads || undefined },
        ]}
        value={tab}
        onChange={setTab}
      />
    </View>
  );

  return tab === 'updates' ? <NotificationList side={side} header={header} /> : <ConversationList side={side} header={header} />;
}
