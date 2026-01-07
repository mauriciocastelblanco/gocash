
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol.ios';
import * as Haptics from 'expo-haptics';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Perfil</Text>

        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <IconSymbol
              ios_icon_name="person.circle.fill"
              android_material_icon_name="account-circle"
              size={80}
              color={colors.primary}
            />
          </View>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Próximamente', 'Esta función estará disponible pronto');
            }}
          >
            <View style={styles.optionLeft}>
              <IconSymbol
                ios_icon_name="bell.fill"
                android_material_icon_name="notifications"
                size={24}
                color={colors.text}
              />
              <Text style={styles.optionText}>Notificaciones</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Próximamente', 'Esta función estará disponible pronto');
            }}
          >
            <View style={styles.optionLeft}>
              <IconSymbol
                ios_icon_name="lock.fill"
                android_material_icon_name="lock"
                size={24}
                color={colors.text}
              />
              <Text style={styles.optionText}>Privacidad</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Próximamente', 'Esta función estará disponible pronto');
            }}
          >
            <View style={styles.optionLeft}>
              <IconSymbol
                ios_icon_name="questionmark.circle.fill"
                android_material_icon_name="help"
                size={24}
                color={colors.text}
              />
              <Text style={styles.optionText}>Ayuda</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Próximamente', 'Esta función estará disponible pronto');
            }}
          >
            <View style={styles.optionLeft}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={24}
                color={colors.text}
              />
              <Text style={styles.optionText}>Acerca de</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <IconSymbol
            ios_icon_name="arrow.right.square.fill"
            android_material_icon_name="logout"
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Versión 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 0, // Espacio para la barra negra superior
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  userCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  optionsContainer: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 24,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 24,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  versionText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
