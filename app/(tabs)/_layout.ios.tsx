
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
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
