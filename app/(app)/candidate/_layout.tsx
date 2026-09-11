import React from 'react';
import { Tabs } from 'expo-router';
import { tabIcon, tabScreenOptions } from '@/components/app/TabBar';
import { useT } from '@/lib/i18n';
import { useUnreadCount } from '@/lib/queries';

export default function CandidateTabs() {
  const { t } = useT();
  const unread = useUnreadCount().data ?? 0;

  return (
    <Tabs screenOptions={tabScreenOptions()}>
      <Tabs.Screen name="index" options={{ title: t('tabs.jobs'), tabBarIcon: tabIcon('briefcase', 'briefcase-outline') }} />
      <Tabs.Screen name="applications" options={{ title: t('tabs.applications'), tabBarIcon: tabIcon('document-text', 'document-text-outline') }} />
      <Tabs.Screen
        name="alerts"
        options={{
          title: t('tabs.alerts'),
          tabBarIcon: tabIcon('notifications', 'notifications-outline'),
          tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarIcon: tabIcon('person', 'person-outline') }} />
    </Tabs>
  );
}
