import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { Colors } from '@/constants/colors';
import { FontSize, fontFamilyFor } from '@/constants/typography';
import { getLocale } from '@/lib/locale';

type IconName = keyof typeof Ionicons.glyphMap;

/** Filled icon when active, outline otherwise — the state reads without relying on colour alone. */
export function tabIcon(active: IconName, inactive: IconName) {
  return ({ focused, color }: { focused: boolean; color: string }) => (
    <Ionicons name={focused ? active : inactive} size={24} color={color} />
  );
}

export function tabScreenOptions(): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: Colors.textTertiary,
    tabBarStyle: {
      backgroundColor: Colors.surface,
      borderTopColor: Colors.borderLight,
      height: 64,
      paddingTop: 6,
    },
    tabBarLabelStyle: {
      fontFamily: fontFamilyFor('semibold', getLocale()),
      fontSize: FontSize.xs,
      marginBottom: 6,
    },
    tabBarBadgeStyle: {
      backgroundColor: Colors.primary,
      fontSize: 10,
      minWidth: 18,
      height: 18,
      lineHeight: 16,
    },
    sceneStyle: { backgroundColor: Colors.background },
  };
}
