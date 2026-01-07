
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <>
      {/* Barra negra fija en la parte superior para cubrir el área de Dynamic Island */}
      <View style={styles.statusBarBackground} />
      
      <NativeTabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#8E8E93',
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          },
          headerShown: false,
        }}
      >
        <NativeTabs.Trigger key="home" name="(home)">
          <Icon sf="chart.bar.fill" />
          <Label>Resumen</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger key="new-transaction" name="new-transaction">
          <Icon sf="plus.circle.fill" />
          <Label>Nueva</Label>
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
    </>
  );
}

const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 60 : 0,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
});
