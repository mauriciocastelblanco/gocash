
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { useCategories, MainCategory, Subcategory } from '@/hooks/useCategories';

export default function CategoriesScreen() {
  const { user } = useAuth();
  const { mainCategories, subcategories, isLoading, refreshCategories, workspaceId } = useCategories();
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedMainCategoryId, setSelectedMainCategoryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateSubcategory = (mainCategoryId: string) => {
    setEditingSubcategory(null);
    setNewSubcategoryName('');
    setSelectedMainCategoryId(mainCategoryId);
    setModalVisible(true);
  };

  const handleEditSubcategory = (subcategory: Subcategory) => {
    setEditingSubcategory(subcategory);
    setNewSubcategoryName(subcategory.nombre);
    setSelectedMainCategoryId(subcategory.main_category_id);
    setModalVisible(true);
  };

  const handleSaveSubcategory = async () => {
    if (!newSubcategoryName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    if (!selectedMainCategoryId) {
      Alert.alert('Error', 'Debe seleccionar una categoría principal');
      return;
    }

    setIsSaving(true);

    try {
      if (editingSubcategory) {
        // Update existing subcategory
        const { error } = await supabase
          .from('subcategories')
          .update({
            nombre: newSubcategoryName.trim(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingSubcategory.id)
          .eq('user_id', user?.id);

        if (error) throw error;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Éxito', 'Subcategoría actualizada correctamente');
      } else {
        // Create new subcategory
        const mainCategory = mainCategories.find(c => c.id === selectedMainCategoryId);
        
        const { error } = await supabase
          .from('subcategories')
          .insert({
            nombre: newSubcategoryName.trim(),
            main_category_id: selectedMainCategoryId,
            user_id: user?.id,
            workspace_id: workspaceId,
            tipo: mainCategory?.tipo || selectedType,
            is_default: false,
          });

        if (error) throw error;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Éxito', 'Subcategoría creada correctamente');
      }

      await refreshCategories();
      setModalVisible(false);
      setNewSubcategoryName('');
      setSelectedMainCategoryId(null);
    } catch (error: any) {
      console.error('Error saving subcategory:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar la subcategoría');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubcategory = (subcategory: Subcategory) => {
    Alert.alert(
      'Eliminar subcategoría',
      `¿Estás seguro de eliminar "${subcategory.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('subcategories')
                .delete()
                .eq('id', subcategory.id)
                .eq('user_id', user?.id);

              if (error) throw error;

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Éxito', 'Subcategoría eliminada correctamente');
              await refreshCategories();
            } catch (error: any) {
              console.error('Error deleting subcategory:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar la subcategoría');
            }
          },
        },
      ]
    );
  };

  const toggleCategory = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  const filteredCategories = mainCategories.filter(cat => cat.tipo === selectedType);
  const incomeCount = mainCategories.filter(c => c.tipo === 'income').length;
  const expenseCount = mainCategories.filter(c => c.tipo === 'expense').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Categorías</Text>
        
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'income' && styles.typeButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedType('income');
              setExpandedCategory(null);
            }}
          >
            <Text style={[styles.typeButtonText, selectedType === 'income' && styles.typeButtonTextActive]}>
              Ingresos ({incomeCount})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.typeButton, selectedType === 'expense' && styles.typeButtonActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedType('expense');
              setExpandedCategory(null);
            }}
          >
            <Text style={[styles.typeButtonText, selectedType === 'expense' && styles.typeButtonTextActive]}>
              Egresos ({expenseCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {filteredCategories.map((category) => {
            const categorySubcategories = subcategories.filter(
              sub => sub.main_category_id === category.id
            );
            const isExpanded = expandedCategory === category.id;

            return (
              <View key={category.id} style={styles.categoryCard}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.categoryLeft}>
                    <IconSymbol
                      ios_icon_name={isExpanded ? 'chevron.down' : 'chevron.right'}
                      android_material_icon_name={isExpanded ? 'expand-more' : 'chevron-right'}
                      size={20}
                      color="#999"
                    />
                    <Text style={styles.categoryIcon}>{category.icono || '📁'}</Text>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName}>{category.nombre}</Text>
                      <Text style={styles.subcategoryCount}>
                        ({categorySubcategories.length} subcategoría{categorySubcategories.length !== 1 ? 's' : ''})
                      </Text>
                    </View>
                  </View>
                  
                  <View style={[styles.typeBadge, selectedType === 'income' && styles.typeBadgeIncome]}>
                    <Text style={[styles.typeBadgeText, selectedType === 'income' && styles.typeBadgeTextIncome]}>
                      {selectedType === 'income' ? 'Ingreso' : 'Egreso'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.subcategoriesList}>
                    {categorySubcategories.map((subcategory) => (
                      <View key={subcategory.id} style={styles.subcategoryItem}>
                        <Text style={styles.subcategoryName}>{subcategory.nombre}</Text>
                        <View style={styles.subcategoryActions}>
                          <TouchableOpacity
                            onPress={() => handleEditSubcategory(subcategory)}
                            style={styles.actionButton}
                            activeOpacity={0.6}
                          >
                            <IconSymbol
                              ios_icon_name="pencil"
                              android_material_icon_name="edit"
                              size={18}
                              color="#999"
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteSubcategory(subcategory)}
                            style={styles.actionButton}
                            activeOpacity={0.6}
                          >
                            <IconSymbol
                              ios_icon_name="trash"
                              android_material_icon_name="delete"
                              size={18}
                              color="#ff6b6b"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}

                    <TouchableOpacity
                      style={styles.addSubcategoryButton}
                      onPress={() => handleCreateSubcategory(category.id)}
                      activeOpacity={0.7}
                    >
                      <IconSymbol
                        ios_icon_name="plus"
                        android_material_icon_name="add"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.addSubcategoryText}>Agregar subcategoría</Text>
                    </TouchableOpacity>

                    {categorySubcategories.length === 0 && (
                      <Text style={styles.emptyText}>No hay subcategorías aún</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {filteredCategories.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No hay categorías</Text>
              <Text style={styles.emptySubtitle}>
                Las categorías principales son gestionadas por el sistema
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingSubcategory ? 'Editar Subcategoría' : 'Nueva Subcategoría'}
            </Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre de la subcategoría"
              placeholderTextColor="#666"
              value={newSubcategoryName}
              onChangeText={setNewSubcategoryName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveSubcategory}
                disabled={isSaving}
                activeOpacity={0.7}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
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
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: colors.background,
  },
  typeButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: colors.text,
  },
  loader: {
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  categoryCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  subcategoryCount: {
    color: '#999',
    fontSize: 12,
    marginTop: 2,
  },
  typeBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeBadgeIncome: {
    backgroundColor: '#e8f5e9',
  },
  typeBadgeText: {
    color: '#c62828',
    fontSize: 12,
    fontWeight: '600',
  },
  typeBadgeTextIncome: {
    color: '#2e7d32',
  },
  subcategoriesList: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
    paddingVertical: 8,
  },
  subcategoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  subcategoryName: {
    color: colors.text,
    fontSize: 15,
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
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 4,
  },
  addSubcategoryText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
