
import { Stack } from 'expo-router';
import { StatusBar, View, StyleSheet, Platform } from 'react-native';
import React from 'react';

export default function HomeLayout() {
  return (
    <>
      {/* Status Bar completamente negro */}
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Barra negra fija en la parte superior (Dynamic Island area) */}
      <View style={styles.statusBarBackground} />
      
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#1a1a1a',
          },
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 60 : 0, // Cubre el área del Dynamic Island
    backgroundColor: '#000000',
    zIndex: 9999,
  },
});
