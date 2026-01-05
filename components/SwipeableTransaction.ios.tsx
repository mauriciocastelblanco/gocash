
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol.ios';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  main_category: string | null;
  subcategory: string | null;
  icon: string | null;
}

interface SwipeableTransactionProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

const SWIPE_THRESHOLD = -80;
const ACTION_WIDTH = 160;

export function SwipeableTransaction({
  transaction,
  onEdit,
  onDelete,
  formatCurrency,
  formatDate,
}: SwipeableTransactionProps) {
  const translateX = useSharedValue(ACTION_WIDTH);
  const isOpen = useSharedValue(false);

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow left swipe
      if (event.translationX < 0) {
        // Map gesture translation to button position
        // When translationX is 0, buttons are at ACTION_WIDTH (hidden)
        // When translationX is -ACTION_WIDTH, buttons are at 0 (fully visible)
        const newPosition = ACTION_WIDTH + event.translationX;
        translateX.value = Math.max(0, Math.min(ACTION_WIDTH, newPosition));
      }
    })
    .onEnd((event) => {
      if (event.translationX < SWIPE_THRESHOLD) {
        // Fully reveal buttons
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 300,
        });
        isOpen.value = true;
        runOnJS(triggerHaptic)();
      } else {
        // Hide buttons
        translateX.value = withSpring(ACTION_WIDTH, {
          damping: 20,
          stiffness: 300,
        });
        isOpen.value = false;
      }
    });

  const actionsAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleEdit = () => {
    translateX.value = withSpring(ACTION_WIDTH);
    isOpen.value = false;
    onEdit(transaction);
  };

  const handleDelete = () => {
    translateX.value = withSpring(ACTION_WIDTH);
    isOpen.value = false;
    onDelete(transaction);
  };

  return (
    <View style={styles.container}>
      {/* Transaction Card - Bottom Layer (stationary) */}
      <GestureDetector gesture={panGesture}>
        <View style={styles.transactionCard}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{transaction.icon || '💰'}</Text>
          </View>
          <View style={styles.detailsContainer}>
            <Text style={styles.description}>{transaction.description}</Text>
            <Text style={styles.category}>
              {transaction.main_category}
              {transaction.subcategory ? ` > ${transaction.subcategory}` : ''}
            </Text>
            <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          </View>
          <Text
            style={[
              styles.amount,
              transaction.type === 'income' ? styles.income : styles.expense,
            ]}
          >
            {formatCurrency(transaction.amount)}
          </Text>
        </View>
      </GestureDetector>

      {/* Action Buttons - Top Layer (slides over from right) */}
      <Animated.View style={[styles.actionsContainer, actionsAnimatedStyle]}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <IconSymbol ios_icon_name="pencil" android_material_icon_name="edit" size={20} color="#fff" />
          <Text style={styles.actionText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <IconSymbol ios_icon_name="trash" android_material_icon_name="delete" size={20} color="#fff" />
          <Text style={styles.actionText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  transactionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    flexDirection: 'row',
    zIndex: 2,
  },
  editButton: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
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
  category: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  income: {
    color: colors.primary,
  },
  expense: {
    color: '#FF3B30',
  },
});
