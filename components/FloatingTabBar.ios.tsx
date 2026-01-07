
import React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { IconSymbol } from '@/components/IconSymbol.ios';
import { colors } from '@/styles/commonStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Href } from 'expo-router';
import { useRouter, usePathname } from 'expo-router';

interface FloatingTabBarProps {
  tabs: any[];
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activeIndex = useSharedValue(0);

  const handleTabPress = (route: Href, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    activeIndex.value = withSpring(index);
    router.push(route);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        {tabs.map((tab, index) => {
          const isActive = pathname.includes(tab.route);
          
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tab}
              onPress={() => handleTabPress(tab.route as Href, index)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={tab.icon}
                size={24}
                color={isActive ? colors.primary : '#8E8E93'}
              />
              <Text style={[styles.label, isActive && styles.activeLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    zIndex: 9999,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#1C1C1E',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
    color: '#8E8E93',
    fontWeight: '500',
  },
  activeLabel: {
    color: colors.primary,
  },
});
