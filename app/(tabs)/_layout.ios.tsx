
import { Tabs } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol.ios';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="house.fill" android_material_icon_name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-transaction"
        options={{
          title: 'Nueva',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="plus.circle.fill" android_material_icon_name="add_circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <IconSymbol ios_icon_name="person.fill" android_material_icon_name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
