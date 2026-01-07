
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
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showAbout, setShowAbout] = useState(false);

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
              console.log('[Profile] Signing out...');
              await signOut();
              console.log('[Profile] Sign out successful');
              // Navigation will be handled by AuthContext
            } catch (error) {
              console.error('[Profile] Sign out error:', error);
              Alert.alert('Error', 'No se pudo cerrar sesión');
            }
          },
        },
      ]
    );
  };

  const handleAboutPress = () => {
    setShowAbout(true);
  };

  const handleTermsPress = () => {
    Alert.alert('Términos y Condiciones', 'Próximamente...');
  };

  const handlePrivacyPress = () => {
    Alert.alert('Política de Privacidad', 'Próximamente...');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
          {user?.email && (
            <Text style={styles.email}>{user.email}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleAboutPress}>
            <Text style={styles.menuItemText}>Acerca de</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleTermsPress}>
            <Text style={styles.menuItemText}>Términos y Condiciones</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPress}>
            <Text style={styles.menuItemText}>Política de Privacidad</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showAbout}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Acerca de</Text>
            <Text style={styles.modalText}>
              App de Gastos v1.0{'\n\n'}
              Una aplicación minimalista para el registro y seguimiento de tus gastos e ingresos.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowAbout(false)}
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
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
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
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  signOutButtonText: {
    color: '#fff',
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
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
