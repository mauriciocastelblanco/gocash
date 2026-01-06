
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <NativeTabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
        },
      }}
    >
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon sf="house.fill" />
        <Label>Inicio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="new-transaction" name="new-transaction">
        <Icon sf="plus.circle.fill" />
        <Label>Agregar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="categories" name="categories">
        <Icon sf="list.bullet" />
        <Label>Categorías</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon sf="person.fill" />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
