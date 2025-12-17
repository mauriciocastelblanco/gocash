
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Inicio',
    },
    {
      name: 'new-transaction',
      route: '/(tabs)/new-transaction',
      icon: 'add',
      label: 'Nueva',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Perfil',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Stack.Screen key="home" name="(home)" />
        <Stack.Screen key="new-transaction" name="new-transaction" />
        <Stack.Screen key="profile" name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
