
import { useAuth } from '@/contexts/AuthContext';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, commonStyles, buttonStyles } from '@/styles/commonStyles';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 16,
    color: colors.text,
  },
  arrow: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  signOutButton: {
    ...buttonStyles.button,
    backgroundColor: '#FF3B30',
    marginTop: 20,
  },
  signOutButtonText: {
    ...buttonStyles.buttonText,
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
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  closeButton: {
    ...buttonStyles.button,
    marginTop: 20,
  },
  closeButtonText: {
    ...buttonStyles.buttonText,
  },
});

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showAbout, setShowAbout] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.subtitle}>{user?.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <TouchableOpacity style={styles.menuItem} onPress={handleAboutPress}>
            <Text style={styles.menuItemText}>Acerca de</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handleTermsPress}>
            <Text style={styles.menuItemText}>Términos y Condiciones</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPress}>
            <Text style={styles.menuItemText}>Política de Privacidad</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAbout}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAbout(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Acerca de Gocash</Text>
              <Text style={styles.modalText}>
                Gocash es una aplicación de gestión financiera personal que te ayuda a controlar tus gastos e ingresos de manera simple y efectiva.
              </Text>
              <Text style={styles.modalText}>
                Versión 1.0.0
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAbout(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal
        visible={showTerms}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTerms(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Términos y Condiciones</Text>
              <Text style={styles.modalText}>
                Al usar Gocash, aceptas estos términos y condiciones. Por favor, léelos cuidadosamente.
              </Text>
              <Text style={styles.modalText}>
                [Aquí irían los términos y condiciones completos]
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTerms(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={showPrivacy}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={true}>
              <Text style={styles.modalTitle}>Política de Privacidad</Text>
              
              <Text style={styles.modalText}>
                En Gocash, operada por CCL TECHNOLOGIES (RUT: 78.115.917-4), protegemos tu privacidad. Esta política explica qué datos recopilamos, para qué los usamos y cómo los cuidamos.
              </Text>

              <Text style={styles.modalSectionTitle}>1) Datos que recopilamos</Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: '600' }}>Identificación:</Text> nombre, RUT, fecha de nacimiento, email, teléfono y datos necesarios para verificar tu identidad.
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: '600' }}>Financieros:</Text> cuentas asociadas, transacciones, cobros y pagos dentro de la plataforma.
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: '600' }}>Uso:</Text> interacción con la app/web, IP, dispositivo, sistema operativo y navegación.
              </Text>
              <Text style={styles.modalText}>
                <Text style={{ fontWeight: '600' }}>Voluntarios:</Text> datos que nos entregues en formularios, encuestas, soporte u otros canales.
              </Text>

              <Text style={styles.modalSectionTitle}>2) Para qué usamos tus datos</Text>
              <Text style={styles.modalText}>
                Para: operar y mantener Gocash, procesar pagos/transferencias/cobros, analizar hábitos de gastos e ingresos, prevenir fraudes o usos ilegales, cumplir obligaciones legales, mejorar el servicio y enviarte comunicaciones del servicio (actualizaciones, cambios y alertas de seguridad).
              </Text>

              <Text style={styles.modalSectionTitle}>3) Base legal</Text>
              <Text style={styles.modalText}>
                Usamos tus datos por: tu consentimiento, la ejecución del contrato (Términos y Condiciones) y el cumplimiento de leyes aplicables en Chile.
              </Text>

              <Text style={styles.modalSectionTitle}>4) Conservación</Text>
              <Text style={styles.modalText}>
                Guardamos tus datos mientras tu cuenta esté activa y el tiempo necesario para cumplir obligaciones legales, resolver disputas o atender requerimientos regulatorios.
              </Text>

              <Text style={styles.modalSectionTitle}>5) Con quién compartimos datos</Text>
              <Text style={styles.modalText}>
                Solo con:
              </Text>
              <Text style={styles.modalText}>
                • Proveedores que operan la plataforma (pagos, hosting, verificación de identidad, soporte).{'\n'}
                • Autoridades, si la ley lo exige.{'\n'}
                • Socios comerciales, solo con tu consentimiento.
              </Text>
              <Text style={styles.modalText}>
                No vendemos tu información personal.
              </Text>

              <Text style={styles.modalSectionTitle}>6) Seguridad</Text>
              <Text style={styles.modalText}>
                Usamos medidas como encriptación, controles de acceso y monitoreo. Aun así, ningún sistema es 100% invulnerable.
              </Text>

              <Text style={styles.modalSectionTitle}>7) Tus derechos (Ley 19.628)</Text>
              <Text style={styles.modalText}>
                Puedes acceder, rectificar, solicitar eliminación (si aplica), oponerte a marketing y pedir suspensión temporal del tratamiento.
              </Text>
              <Text style={styles.modalText}>
                Contacto: contacto@gocash.cl
              </Text>

              <Text style={styles.modalSectionTitle}>8) Cookies</Text>
              <Text style={styles.modalText}>
                Podemos usar cookies para mejorar la experiencia y analizar el uso. Puedes desactivarlas, pero algunas funciones pueden fallar.
              </Text>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPrivacy(false)}
              >
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
