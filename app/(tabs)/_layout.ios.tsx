
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { colors } from '@/styles/commonStyles';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <NativeTabs
      tintColor="#FFFFFF"
      backgroundColor={colors.background}
      blurEffect="systemChromeMaterialDark"
      labelStyle={{
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '600',
      }}
    >
      <NativeTabs.Trigger name="(home)">
        <Icon 
          sf={{ default: 'house', selected: 'house.fill' }} 
          drawable="home"
        />
        <Label>Inicio</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="dashboard">
        <Icon 
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} 
          drawable="analytics"
        />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="new-transaction">
        <Icon 
          sf={{ default: 'plus', selected: 'plus' }} 
          drawable="add"
        />
        <Label>Nueva</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon 
          sf={{ default: 'person', selected: 'person.fill' }} 
          drawable="person"
        />
        <Label>Perfil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
