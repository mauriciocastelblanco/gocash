
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import FloatingTabBar from '@/components/FloatingTabBar';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  return (
    <>
      {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#000000',
          },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: 'Resumen',
          }}
        />
        <Tabs.Screen
          name="new-transaction"
          options={{
            title: 'Nueva',
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            title: 'Categorías',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
          }}
        />
      </Tabs>
    </>
  );
}
