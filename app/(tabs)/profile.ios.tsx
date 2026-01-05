
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol.ios";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { supabase } from "@/app/integrations/supabase/client";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: 'No se encontró usuario autenticado' };
    }

    console.log('[DELETE-ACCOUNT] Iniciando eliminación para usuario:', user.id);

    const { data, error } = await supabase.functions.invoke('delete-user-account', {
      body: { userId: user.id }
    });

    if (error) {
      console.error('[DELETE-ACCOUNT] Error en Edge Function:', error);
      return { success: false, error: error.message || 'Error al eliminar la cuenta' };
    }

    console.log('[DELETE-ACCOUNT] Cuenta eliminada exitosamente:', data);
    await supabase.auth.signOut();

    return { success: true };
  } catch (error: any) {
    console.error('[DELETE-ACCOUNT] Error inesperado:', error);
    return { success: false, error: error.message || 'Error inesperado' };
  }
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText.toUpperCase() !== 'ELIMINAR') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsDeleting(true);

    try {
      const result = await deleteUserAccount();

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Cuenta Eliminada',
          'Tu cuenta ha sido eliminada permanentemente',
          [{ text: 'OK', onPress: () => router.replace('/login') }]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Error', result.error || 'No se pudo eliminar la cuenta');
      }
    } finally {
      setIsDeleting(false);
      setConfirmText('');
      setShowDeleteModal(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <GlassView style={styles.profileHeader} glassEffectStyle="regular">
          <IconSymbol ios_icon_name="person.circle.fill" android_material_icon_name="person" size={80} color={theme.colors.primary} />
          <Text style={[styles.name, { color: theme.colors.text }]}>John Doe</Text>
          <Text style={[styles.email, { color: theme.dark ? '#98989D' : '#666' }]}>john.doe@example.com</Text>
        </GlassView>

        <GlassView style={styles.section} glassEffectStyle="regular">
          <View style={styles.infoRow}>
            <IconSymbol ios_icon_name="phone.fill" android_material_icon_name="phone" size={20} color={theme.dark ? '#98989D' : '#666'} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>+1 (555) 123-4567</Text>
          </View>
          <View style={styles.infoRow}>
            <IconSymbol ios_icon_name="location.fill" android_material_icon_name="location-on" size={20} color={theme.dark ? '#98989D' : '#666'} />
            <Text style={[styles.infoText, { color: theme.colors.text }]}>San Francisco, CA</Text>
          </View>
        </GlassView>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowDeleteModal(true);
          }}
        >
          <IconSymbol ios_icon_name="trash.fill" android_material_icon_name="delete" size={20} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>Eliminar Cuenta</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassView style={styles.modalContent} glassEffectStyle="prominent">
            <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={48} color="#FF3B30" />
            
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>¿Eliminar Cuenta?</Text>
            <Text style={[styles.modalDescription, { color: theme.dark ? '#98989D' : '#666' }]}>
              Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos.
            </Text>

            <Text style={[styles.modalLabel, { color: theme.colors.text }]}>
              Escribe "ELIMINAR" para confirmar:
            </Text>
            <TextInput
              style={[styles.modalInput, { 
                backgroundColor: theme.dark ? '#2C2C2E' : '#F2F2F7',
                color: theme.colors.text,
                borderColor: confirmText.toUpperCase() === 'ELIMINAR' ? '#52DF68' : (theme.dark ? '#3A3A3C' : '#E5E5EA')
              }]}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="ELIMINAR"
              placeholderTextColor={theme.dark ? '#666' : '#999'}
              autoCapitalize="characters"
              editable={!isDeleting}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowDeleteModal(false);
                  setConfirmText('');
                }}
                disabled={isDeleting}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, {
                  opacity: (confirmText.toUpperCase() === 'ELIMINAR' && !isDeleting) ? 1 : 0.5
                }]}
                onPress={handleDeleteAccount}
                disabled={confirmText.toUpperCase() !== 'ELIMINAR' || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Eliminar</Text>
                )}
              </TouchableOpacity>
            </View>
          </GlassView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    gap: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    alignSelf: 'flex-start',
  },
  modalInput: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
