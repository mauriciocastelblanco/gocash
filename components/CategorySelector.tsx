
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/styles/commonStyles';
import { MainCategory, Subcategory } from '@/hooks/useCategories';

interface CategorySelectorProps {
  mainCategories: MainCategory[];
  subcategories: Subcategory[];
  selectedMainCategoryId: string | null;
  selectedSubcategoryId: string | null;
  onMainCategorySelect: (categoryId: string) => void;
  onSubcategorySelect: (subcategoryId: string) => void;
  type: 'expense' | 'income';
  isLoading?: boolean;
}

export function CategorySelector({
  mainCategories,
  subcategories,
  selectedMainCategoryId,
  selectedSubcategoryId,
  onMainCategorySelect,
  onSubcategorySelect,
  type,
  isLoading = false,
}: CategorySelectorProps) {
  const [showMainCategoryModal, setShowMainCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);

  const filteredMainCategories = mainCategories.filter((cat) => cat.tipo === type);
  const filteredSubcategories = selectedMainCategoryId
    ? subcategories.filter((sub) => sub.main_category_id === selectedMainCategoryId)
    : [];

  const selectedMainCategory = mainCategories.find((cat) => cat.id === selectedMainCategoryId);
  const selectedSubcategory = subcategories.find((sub) => sub.id === selectedSubcategoryId);

  // Reset subcategory when main category changes
  useEffect(() => {
    if (selectedMainCategoryId && selectedSubcategoryId) {
      const subcategoryBelongsToCategory = filteredSubcategories.some(
        (sub) => sub.id === selectedSubcategoryId
      );
      if (!subcategoryBelongsToCategory) {
        onSubcategorySelect('');
      }
    }
  }, [selectedMainCategoryId]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Cargando categorías...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Main Category Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Categoría Principal *</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowMainCategoryModal(true)}
        >
          <View style={styles.selectorContent}>
            {selectedMainCategory ? (
              <>
                <Text style={styles.selectorEmoji}>{selectedMainCategory.icono || '📁'}</Text>
                <Text style={styles.selectorText}>{selectedMainCategory.nombre}</Text>
              </>
            ) : (
              <Text style={styles.selectorPlaceholder}>Seleccionar categoría...</Text>
            )}
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Subcategory Selector */}
      {selectedMainCategoryId && (
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Subcategoría *</Text>
          <TouchableOpacity
            style={[
              styles.selectorButton,
              filteredSubcategories.length === 0 && styles.selectorButtonDisabled,
            ]}
            onPress={() => {
              if (filteredSubcategories.length > 0) {
                setShowSubcategoryModal(true);
              }
            }}
            disabled={filteredSubcategories.length === 0}
          >
            <View style={styles.selectorContent}>
              {selectedSubcategory ? (
                <Text style={styles.selectorText}>{selectedSubcategory.nombre}</Text>
              ) : filteredSubcategories.length === 0 ? (
                <Text style={styles.selectorPlaceholder}>
                  No hay subcategorías disponibles
                </Text>
              ) : (
                <Text style={styles.selectorPlaceholder}>Seleccionar subcategoría...</Text>
              )}
            </View>
            {filteredSubcategories.length > 0 && <Text style={styles.chevron}>›</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Main Category Modal */}
      <Modal
        visible={showMainCategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMainCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity onPress={() => setShowMainCategoryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {filteredMainCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.modalItem,
                    selectedMainCategoryId === category.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    onMainCategorySelect(category.id);
                    setShowMainCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemEmoji}>{category.icono || '📁'}</Text>
                  <Text style={styles.modalItemText}>{category.nombre}</Text>
                  {selectedMainCategoryId === category.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        visible={showSubcategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSubcategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Subcategoría</Text>
              <TouchableOpacity onPress={() => setShowSubcategoryModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {filteredSubcategories.map((subcategory) => (
                <TouchableOpacity
                  key={subcategory.id}
                  style={[
                    styles.modalItem,
                    selectedSubcategoryId === subcategory.id && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    onSubcategorySelect(subcategory.id);
                    setShowSubcategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{subcategory.nombre}</Text>
                  {selectedSubcategoryId === subcategory.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorButtonDisabled: {
    opacity: 0.5,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectorEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  selectorText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  modalScroll: {
    flex: 1,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemSelected: {
    backgroundColor: colors.card,
  },
  modalItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: '700',
  },
});
