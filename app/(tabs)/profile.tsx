
import { useAuth } from '@/contexts/AuthContext';
import React, { useState } from 'react';
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
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutText: {
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
    backgroundColor: colors.card,
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
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const handleAboutPress = () => {
    setShowAboutModal(true);
  };

  const handleTermsPress = () => {
    setShowTermsModal(true);
  };

  const handlePrivacyPress = () => {
    setShowPrivacyModal(true);
  };

  const handleSignOut = async () => {
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
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
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
          <Text style={styles.signOutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Acerca de Gocash</Text>
            <ScrollView>
              <Text style={styles.modalText}>
                Gocash es una aplicación de gestión financiera personal que te ayuda a controlar tus gastos e ingresos de manera simple y efectiva.
              </Text>
              <Text style={styles.modalText}>
                Versión: 1.0.0
              </Text>
              <Text style={styles.modalText}>
                Desarrollado por CCL TECHNOLOGIES
              </Text>
              <Text style={styles.modalText}>
                RUT: 78.115.917-4
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Terms Modal */}
      <Modal
        visible={showTermsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Términos y Condiciones</Text>
            <ScrollView>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>1) Aceptación</Text>
                <Text style={styles.modalText}>
                  Al registrarte, acceder o usar Gocash ("la Plataforma"), aceptas estos Términos y Condiciones y la Política de Privacidad. Si no estás de acuerdo, no uses la plataforma.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>2) Qué es Gocash</Text>
                <Text style={styles.modalText}>
                  Gocash es una billetera digital que te permite:{'\n\n'}
                  • Registrar y ver gastos e ingresos.{'\n'}
                  • Analizar hábitos de consumo.{'\n'}
                  • Recibir ayuda en gestión y cobro de pagos.{'\n'}
                  • Hacer y recibir transferencias entre cuentas compatibles.{'\n\n'}
                  Gocash no es un banco ni una institución financiera regulada, y los saldos no generan intereses.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>3) Registro y datos</Text>
                <Text style={styles.modalText}>
                  Para usar Gocash debes:{'\n\n'}
                  • Ser mayor de 18 años.{'\n'}
                  • Registrarte con información real, actual y completa.{'\n'}
                  • Cuidar tus credenciales de acceso.{'\n\n'}
                  Podemos pedir información o documentos para verificar identidad y prevenir fraudes.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>4) Uso permitido</Text>
                <Text style={styles.modalText}>
                  Te comprometes a:{'\n\n'}
                  • Usar la plataforma solo con fines legales.{'\n'}
                  • No usarla para fraudes, lavado de dinero o financiamiento del terrorismo.{'\n'}
                  • No afectar el funcionamiento técnico o la seguridad de la plataforma.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>5) Seguridad de cuenta</Text>
                <Text style={styles.modalText}>
                  Eres responsable de:{'\n\n'}
                  • Mantener tus contraseñas confidenciales.{'\n'}
                  • Avisarnos de inmediato si detectas accesos no autorizados.{'\n\n'}
                  Aplicamos medidas de seguridad, pero no podemos garantizar seguridad absoluta.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>6) Membresías, comisiones y tarifas</Text>
                <Text style={styles.modalText}>
                  Algunos servicios pueden tener costos:{'\n\n'}
                  • Membresía mensual: para funciones premium. El monto se informa al registrarte y puede cambiar con aviso mínimo de 15 días.{'\n'}
                  • Comisión por transacción: si usas Gocash para cobro de deudas a terceros, se aplicará una comisión informada antes del pago y descontada automáticamente.{'\n\n'}
                  Valores en CLP, con o sin IVA según corresponda. Si no pagas la membresía, podemos suspender o limitar funciones hasta regularización.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>7) Limitación de responsabilidad</Text>
                <Text style={styles.modalText}>
                  Gocash no responde por:{'\n\n'}
                  • Uso indebido de tus credenciales.{'\n'}
                  • Caídas del servicio por causas externas (internet, fallas técnicas, fuerza mayor).{'\n'}
                  • Daños indirectos, lucro cesante o pérdida de datos.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>8) Datos personales</Text>
                <Text style={styles.modalText}>
                  Tratamos datos según la Ley 19.628 y normas aplicables. Usamos la información solo para prestar el servicio y no la compartimos con terceros no autorizados.{'\n\n'}
                  Contacto: contacto@gocash.cl
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>9) Cambios</Text>
                <Text style={styles.modalText}>
                  Podemos actualizar estos términos con aviso previo. Si sigues usando la plataforma, se entiende que aceptas los cambios.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>10) Ley y jurisdicción</Text>
                <Text style={styles.modalText}>
                  Se aplica la ley de Chile. Cualquier disputa se verá en tribunales de Santiago de Chile.
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Modal */}
      <Modal
        visible={showPrivacyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Política de Privacidad</Text>
            <ScrollView>
              <Text style={styles.modalText}>
                En Gocash, operada por CCL TECHNOLOGIES (RUT: 78.115.917-4), protegemos tu privacidad. Esta política explica qué datos recopilamos, para qué los usamos y cómo los cuidamos.
              </Text>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>1) Datos que recopilamos</Text>
                <Text style={styles.modalText}>
                  • Identificación: nombre, RUT, fecha de nacimiento, email, teléfono y datos necesarios para verificar tu identidad.{'\n\n'}
                  • Financieros: cuentas asociadas, transacciones, cobros y pagos dentro de la plataforma.{'\n\n'}
                  • Uso: interacción con la app/web, IP, dispositivo, sistema operativo y navegación.{'\n\n'}
                  • Voluntarios: datos que nos entregues en formularios, encuestas, soporte u otros canales.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>2) Para qué usamos tus datos</Text>
                <Text style={styles.modalText}>
                  Para: operar y mantener Gocash, procesar pagos/transferencias/cobros, analizar hábitos de gastos e ingresos, prevenir fraudes o usos ilegales, cumplir obligaciones legales, mejorar el servicio y enviarte comunicaciones del servicio (actualizaciones, cambios y alertas de seguridad).
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>3) Base legal</Text>
                <Text style={styles.modalText}>
                  Usamos tus datos por: tu consentimiento, la ejecución del contrato (Términos y Condiciones) y el cumplimiento de leyes aplicables en Chile.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>4) Conservación</Text>
                <Text style={styles.modalText}>
                  Guardamos tus datos mientras tu cuenta esté activa y el tiempo necesario para cumplir obligaciones legales, resolver disputas o atender requerimientos regulatorios.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>5) Con quién compartimos datos</Text>
                <Text style={styles.modalText}>
                  Solo con:{'\n\n'}
                  • Proveedores que operan la plataforma (pagos, hosting, verificación de identidad, soporte).{'\n'}
                  • Autoridades, si la ley lo exige.{'\n'}
                  • Socios comerciales, solo con tu consentimiento.{'\n\n'}
                  No vendemos tu información personal.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>6) Seguridad</Text>
                <Text style={styles.modalText}>
                  Usamos medidas como encriptación, controles de acceso y monitoreo. Aun así, ningún sistema es 100% invulnerable.
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>7) Tus derechos (Ley 19.628)</Text>
                <Text style={styles.modalText}>
                  Puedes acceder, rectificar, solicitar eliminación (si aplica), oponerte a marketing y pedir suspensión temporal del tratamiento.{'\n\n'}
                  Contacto: contacto@gocash.cl
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>8) Cookies</Text>
                <Text style={styles.modalText}>
                  Podemos usar cookies para mejorar la experiencia y analizar el uso. Puedes desactivarlas, pero algunas funciones pueden fallar.
                </Text>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
