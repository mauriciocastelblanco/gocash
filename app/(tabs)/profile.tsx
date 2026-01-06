
import React, { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import * as Haptics from 'expo-haptics';

const NOTIFICATION_PREFERENCE_KEY = '@transaction_reminder_enabled';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  signOutButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  signOutButtonText: {
    color: '#1A1A1A',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    loadNotificationPreference();
  }, []);

  const loadNotificationPreference = async () => {
    try {
      const value = await AsyncStorage.getItem(NOTIFICATION_PREFERENCE_KEY);
      if (value !== null) {
        setReminderEnabled(value === 'true');
      }
    } catch (error) {
      console.error('Error loading notification preference:', error);
    }
  };

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  };

  const scheduleTransactionReminder = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 Recordatorio de Gastos',
        body: '¿Ya registraste tus transacciones de hoy?',
        sound: true,
      },
      trigger: {
        hour: 21,
        minute: 0,
        repeats: true,
      },
    });
  };

  const handleToggleReminder = async (value: boolean) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (value) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permisos requeridos',
          'Por favor, habilita las notificaciones en la configuración de tu dispositivo.'
        );
        return;
      }

      await scheduleTransactionReminder();
      await AsyncStorage.setItem(NOTIFICATION_PREFERENCE_KEY, 'true');
      setReminderEnabled(true);
    } else {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(NOTIFICATION_PREFERENCE_KEY, 'false');
      setReminderEnabled(false);
    }
  };

  const handleAboutPress = () => {
    setShowAbout(true);
  };

  const handleTermsPress = () => {
    setShowTerms(true);
  };

  const handlePrivacyPress = () => {
    setShowPrivacy(true);
  };

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Eliminar Cuenta',
      '⚠️ Esta acción es permanente y eliminará todos tus datos. ¿Estás completamente seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete user data from database
              if (user?.id) {
                // Delete user's transactions
                const { error: transactionsError } = await supabase
                  .from('transactions')
                  .delete()
                  .eq('user_id', user.id);

                if (transactionsError) {
                  console.error('Error deleting transactions:', transactionsError);
                }

                // Delete user's categories
                const { error: categoriesError } = await supabase
                  .from('categories')
                  .delete()
                  .eq('user_id', user.id);

                if (categoriesError) {
                  console.error('Error deleting categories:', categoriesError);
                }

                // Delete user's workspaces
                const { error: workspacesError } = await supabase
                  .from('workspaces')
                  .delete()
                  .eq('user_id', user.id);

                if (workspacesError) {
                  console.error('Error deleting workspaces:', workspacesError);
                }
              }

              // Sign out the user
              await signOut();
              
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Cuenta Eliminada', 'Tu cuenta ha sido eliminada exitosamente.');
              router.replace('/login');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'No se pudo eliminar la cuenta. Intenta nuevamente.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Notifications Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Recordatorio diario</Text>
            <Text style={styles.settingDescription}>
              Recibe una notificación todos los días a las 9:00 PM para recordarte ingresar tus transacciones
            </Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleToggleReminder}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleAboutPress}>
          <Text style={styles.menuItemText}>Acerca de</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleTermsPress}>
          <Text style={styles.menuItemText}>Términos y Condiciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={handlePrivacyPress}>
          <Text style={styles.menuItemText}>Política de Privacidad</Text>
        </TouchableOpacity>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Delete Account Button */}
      <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteAccountButtonText}>Eliminar Cuenta</Text>
      </TouchableOpacity>

      {/* Modals */}
      <Modal visible={showAbout} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Acerca de</Text>
            <Text style={styles.modalText}>
              Aplicación de registro de gastos v1.0{'\n\n'}
              Desarrollada para ayudarte a mantener un control detallado de tus finanzas personales.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={() => setShowAbout(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showTerms} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Términos y Condiciones</Text>
            <Text style={styles.modalText}>
              Al usar esta aplicación, aceptas nuestros términos de servicio y te comprometes a usar la aplicación de manera responsable.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={() => setShowTerms(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPrivacy} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Política de Privacidad</Text>
            <Text style={styles.modalText}>
              Tus datos están protegidos y solo se usan para el funcionamiento de la aplicación. No compartimos tu información con terceros.
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={() => setShowPrivacy(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
