import React from 'react';
import { Tabs } from 'expo-router';
import { tabIcon, tabScreenOptions } from '@/components/app/TabBar';
import { useT } from '@/lib/i18n';
import { useUnreadCount } from '@/lib/queries';

export default function RestaurantTabs() {
  const { t } = useT();
  const unread = useUnreadCount().data ?? 0;

  return (
    <Tabs screenOptions={tabScreenOptions()}>
      <Tabs.Screen name="index" options={{ title: t('tabs.jobs'), tabBarIcon: tabIcon('briefcase', 'briefcase-outline') }} />
      <Tabs.Screen name="staff" options={{ title: t('tabs.staff'), tabBarIcon: tabIcon('people', 'people-outline') }} />
      <Tabs.Screen name="interviews" options={{ title: t('tabs.interviews'), tabBarIcon: tabIcon('calendar', 'calendar-outline') }} />
      <Tabs.Screen
        name="alerts"
        options={{
          title: t('tabs.alerts'),
          tabBarIcon: tabIcon('notifications', 'notifications-outline'),
          tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
        }}
      />
      <Tabs.Screen name="business" options={{ title: t('tabs.business'), tabBarIcon: tabIcon('storefront', 'storefront-outline') }} />
    </Tabs>
  );
}
