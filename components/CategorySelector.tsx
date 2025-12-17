
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
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

  const handleMainCategoryPress = () => {
    console.log('[CategorySelector] Opening main category modal');
    console.log('[CategorySelector] Filtered main categories:', filteredMainCategories.length);
    Haptics.selectionAsync();
    setShowMainCategoryModal(true);
  };

  const handleSubcategoryPress = () => {
    if (filteredSubcategories.length > 0) {
      console.log('[CategorySelector] Opening subcategory modal');
      console.log('[CategorySelector] Filtered subcategories:', filteredSubcategories.length);
      Haptics.selectionAsync();
      setShowSubcategoryModal(true);
    }
  };

  const handleMainCategorySelect = (categoryId: string) => {
    console.log('[CategorySelector] Selected main category:', categoryId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMainCategorySelect(categoryId);
    setShowMainCategoryModal(false);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    console.log('[CategorySelector] Selected subcategory:', subcategoryId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubcategorySelect(subcategoryId);
    setShowSubcategoryModal(false);
  };

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
          onPress={handleMainCategoryPress}
          activeOpacity={0.7}
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
            onPress={handleSubcategoryPress}
            disabled={filteredSubcategories.length === 0}
            activeOpacity={0.7}
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
        onRequestClose={() => {
          console.log('[CategorySelector] Closing main category modal');
          setShowMainCategoryModal(false);
        }}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowMainCategoryModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Categoría</Text>
              <TouchableOpacity 
                onPress={() => setShowMainCategoryModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {filteredMainCategories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay categorías disponibles</Text>
                </View>
              ) : (
                filteredMainCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.modalItem,
                      selectedMainCategoryId === category.id && styles.modalItemSelected,
                    ]}
                    onPress={() => handleMainCategorySelect(category.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalItemEmoji}>{category.icono || '📁'}</Text>
                    <Text style={styles.modalItemText}>{category.nombre}</Text>
                    {selectedMainCategoryId === category.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Subcategory Modal */}
      <Modal
        visible={showSubcategoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          console.log('[CategorySelector] Closing subcategory modal');
          setShowSubcategoryModal(false);
        }}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={() => setShowSubcategoryModal(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Subcategoría</Text>
              <TouchableOpacity 
                onPress={() => setShowSubcategoryModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {filteredSubcategories.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No hay subcategorías disponibles</Text>
                </View>
              ) : (
                filteredSubcategories.map((subcategory) => (
                  <TouchableOpacity
                    key={subcategory.id}
                    style={[
                      styles.modalItem,
                      selectedSubcategoryId === subcategory.id && styles.modalItemSelected,
                    ]}
                    onPress={() => handleSubcategorySelect(subcategory.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalItemText}>{subcategory.nombre}</Text>
                    {selectedSubcategoryId === subcategory.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )}
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  selectorPlaceholder: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
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
