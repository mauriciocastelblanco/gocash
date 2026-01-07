
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { useCategories, MainCategory, Subcategory } from '@/hooks/useCategories';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol.ios';
import { useAuth } from '@/contexts/AuthContext';

export default function CategoriesScreen() {
  const { user } = useAuth();
  const { mainCategories, subcategories, isLoading, refreshCategories } = useCategories();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreateSubcategory = (mainCategoryId: string) => {
    setSelectedMainCategoryId(mainCategoryId);
    setEditingSubcategory(null);
    setNewSubcategoryName('');
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setNewSubcategoryName(subcategory.nombre);
    setSelectedMainCategoryId(subcategory.main_category_id);
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSaveSubcategory = async () => {
    if (!newSubcategoryName.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la subcategoría');
      return;
    }

    if (!selectedMainCategoryId) {
      Alert.alert('Error', 'No se pudo identificar la categoría principal');
      return;
    }

    setIsSaving(true);

    try {
      if (editingSubcategory) {
        const { error } = await supabase
          .from('subcategories')
          .update({ nombre: newSubcategoryName.trim() })
          .eq('id', editingSubcategory.id);

        if (error) throw error;

        Alert.alert('Éxito', 'Subcategoría actualizada correctamente');
      } else {
        const { error } = await supabase
          .from('subcategories')
          .insert({
            nombre: newSubcategoryName.trim(),
            main_category_id: selectedMainCategoryId,
          });

        if (error) throw error;

        Alert.alert('Éxito', 'Subcategoría creada correctamente');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setModalVisible(false);
      refreshCategories();
    } catch (error) {
      console.error('Error saving subcategory:', error);
      Alert.alert('Error', 'No se pudo guardar la subcategoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubcategory = (subcategory: Subcategory) => {
    Alert.alert(
      'Eliminar subcategoría',
      `¿Estás seguro de que deseas eliminar "${subcategory.nombre}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('subcategories')
                .delete()
                .eq('id', subcategory.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Éxito', 'Subcategoría eliminada correctamente');
              refreshCategories();
            } catch (error) {
              console.error('Error deleting subcategory:', error);
              Alert.alert('Error', 'No se pudo eliminar la subcategoría');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]} edges={['bottom']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Categorías</Text>
        <Text style={styles.subtitle}>
          Gestiona tus categorías y subcategorías
        </Text>

        {mainCategories.map((category) => {
          const categorySubcategories = subcategories.filter(
            (sub) => sub.main_category_id === category.id
          );
          const isExpanded = expandedCategories.has(category.id);

          return (
            <View key={category.id} style={styles.categoryCard}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category.id)}
              >
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryIcon}>{category.icono}</Text>
                  <View style={styles.categoryTextContainer}>
                    <Text style={styles.categoryName}>{category.nombre}</Text>
                    <Text style={styles.categoryType}>
                      {category.tipo === 'expense' ? 'Gasto' : 'Ingreso'}
                    </Text>
                  </View>
                </View>
                <IconSymbol
                  ios_icon_name={isExpanded ? 'chevron.up' : 'chevron.down'}
                  android_material_icon_name={isExpanded ? 'expand-less' : 'expand-more'}
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.subcategoriesContainer}>
                  {categorySubcategories.map((subcategory) => (
                    <View key={subcategory.id} style={styles.subcategoryItem}>
                      <Text style={styles.subcategoryName}>
                        {subcategory.nombre}
                      </Text>
                      <View style={styles.subcategoryActions}>
                        <TouchableOpacity
                          onPress={() => handleEditSubcategory(subcategory)}
                          style={styles.actionButton}
                        >
                          <IconSymbol
                            ios_icon_name="pencil"
                            android_material_icon_name="edit"
                            size={20}
                            color={colors.primary}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteSubcategory(subcategory)}
                          style={styles.actionButton}
                        >
                          <IconSymbol
                            ios_icon_name="trash"
                            android_material_icon_name="delete"
                            size={20}
                            color="#EF4444"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addSubcategoryButton}
                    onPress={() => handleCreateSubcategory(category.id)}
                  >
                    <IconSymbol
                      ios_icon_name="plus.circle.fill"
                      android_material_icon_name="add-circle"
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.addSubcategoryText}>
                      Agregar subcategoría
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Modal for creating/editing subcategory */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSubcategory ? 'Editar' : 'Nueva'} Subcategoría
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={newSubcategoryName}
                onChangeText={setNewSubcategoryName}
                placeholder="Ej: Frutas y verduras"
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSubcategory}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 0, // Espacio para la barra negra superior
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryType: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  subcategoriesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
    paddingTop: 8,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  subcategoryName: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  subcategoryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  addSubcategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 8,
  },
  addSubcategoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.card,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.card,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.card,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
