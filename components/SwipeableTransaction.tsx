
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const SWIPE_THRESHOLD = -80;
const ACTION_WIDTH = 80;

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  main_category: string | null;
  subcategory: string | null;
  icon: string | null;
  installment_current?: number;
  installment_total?: number;
}

interface SwipeableTransactionProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export const SwipeableTransaction: React.FC<SwipeableTransactionProps> = ({
  transaction,
  onEdit,
  onDelete,
  formatCurrency,
  formatDate,
}) => {
  const translateX = useSharedValue(0);
  const isOpen = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeSwipe = () => {
    translateX.value = withSpring(0, {
      damping: 20,
      stiffness: 300,
    });
    isOpen.value = false;
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    closeSwipe();
    onEdit(transaction);
  };

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    closeSwipe();
    onDelete(transaction);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const newTranslateX = event.translationX;
      if (newTranslateX < 0) {
        // Swiping left - limit to double the action width
        translateX.value = Math.max(newTranslateX, SWIPE_THRESHOLD * 2);
      } else if (isOpen.value) {
        // Swiping right when open - allow closing
        translateX.value = Math.min(newTranslateX + SWIPE_THRESHOLD, 0);
      }
    })
    .onEnd((event) => {
      if (event.translationX < SWIPE_THRESHOLD) {
        // Open actions
        translateX.value = withSpring(SWIPE_THRESHOLD, {
          damping: 20,
          stiffness: 300,
        });
        isOpen.value = true;
        runOnJS(triggerHaptic)();
      } else {
        // Close actions
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
        isOpen.value = false;
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Hidden action buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="pencil"
            android_material_icon_name="edit"
            size={20}
            color="#fff"
          />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={handleDelete}
          activeOpacity={0.7}
        >
          <IconSymbol
            ios_icon_name="trash"
            android_material_icon_name="delete"
            size={20}
            color="#fff"
          />
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable transaction card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.transactionCard, animatedStyle]}>
          <View style={styles.transactionLeft}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{transaction.icon || '💰'}</Text>
            </View>
            <View style={styles.detailsContainer}>
              <Text style={styles.description} numberOfLines={1}>
                {transaction.description}
              </Text>
              {transaction.main_category && (
                <View style={styles.categoryRow}>
                  <Text style={styles.category} numberOfLines={1}>
                    {transaction.main_category}
                    {transaction.subcategory && ` > ${transaction.subcategory}`}
                  </Text>
                </View>
              )}
              {transaction.installment_total && transaction.installment_total > 1 && (
                <Text style={styles.installment}>
                  Cuota {transaction.installment_current}/{transaction.installment_total}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.amount,
                transaction.type === 'income' ? styles.income : styles.expense,
              ]}
            >
              {formatCurrency(transaction.amount)}
            </Text>
            <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: ACTION_WIDTH,
    height: '100%',
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    gap: 4,
  },
  deleteButton: {
    width: ACTION_WIDTH,
    height: '100%',
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    gap: 4,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  transactionCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.backgroundAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  detailsContainer: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  installment: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  income: {
    color: '#22C55E',
  },
  expense: {
    color: '#EF4444',
  },
  date: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
