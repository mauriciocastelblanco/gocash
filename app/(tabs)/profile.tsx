
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });

  const handleAboutPress = () => {
    setModalContent({
      title: 'Acerca de',
      message: 'Una herramienta de planificación financiera que te ayuda a crear un presupuesto mensual inteligente, registrar tus gastos e ingresos automáticamente, y medir tu progreso mes a mes para que puedas tomar decisiones más conscientes con tu dinero.',
    });
    setModalVisible(true);
  };

  const handleTermsPress = () => {
    setModalContent({
      title: 'Términos y condiciones',
      message: 'Próximamente',
    });
    setModalVisible(true);
  };

  const handlePrivacyPress = () => {
    setModalContent({
      title: 'Privacidad',
      message: 'Próximamente',
    });
    setModalVisible(true);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[ProfileScreen] Signing out...');
              await signOut();
              console.log('[ProfileScreen] Sign out successful, redirecting to login...');
              router.replace('/login');
            } catch (error) {
              console.error('[ProfileScreen] Error signing out:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión. Por favor intenta de nuevo.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[commonStyles.container, styles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.userName}>{user?.email || 'Usuario'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>
          
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemEmoji}>🔔</Text>
              <Text style={styles.menuItemText}>Notificaciones</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACIÓN</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleAboutPress}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemEmoji}>ℹ️</Text>
              <Text style={styles.menuItemText}>Acerca de</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTermsPress}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemEmoji}>📄</Text>
              <Text style={styles.menuItemText}>Términos y condiciones</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPress}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuItemEmoji}>🔒</Text>
              <Text style={styles.menuItemText}>Privacidad</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[buttonStyles.secondaryButton, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <Text style={[buttonStyles.secondaryButtonText, styles.signOutText]}>
            Cerrar Sesión
          </Text>
        </TouchableOpacity>

        <Text style={styles.version}>Versión 1.0.0</Text>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modalContent.title}</Text>
            <Text style={styles.modalMessage}>{modalContent.message}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 48,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuItem: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  menuItemArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  signOutButton: {
    marginBottom: 16,
  },
  signOutText: {
    color: colors.error,
  },
  version: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
