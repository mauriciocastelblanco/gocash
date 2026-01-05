
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/styles/commonStyles';
import Svg, { Circle, G } from 'react-native-svg';

interface CategoryExpense {
  category: string;
  icon: string;
  amount: number;
  color: string;
}

interface ExpenseChartProps {
  expenses: CategoryExpense[];
  total: number;
}

const CHART_SIZE = Dimensions.get('window').width - 80;
const RADIUS = CHART_SIZE / 2 - 20;
const STROKE_WIDTH = 40;

const CATEGORY_COLORS = [
  '#52DF68', // Verde principal
  '#4ECDC4', // Turquesa
  '#FFE66D', // Amarillo
  '#FF6B6B', // Rojo
  '#A8E6CF', // Verde claro
  '#FFD3B6', // Naranja claro
  '#FFAAA5', // Rosa
  '#B4A7D6', // Púrpura
];

export function ExpenseChart({ expenses, total }: ExpenseChartProps) {
  const chartData = useMemo(() => {
    if (total === 0) return [];
    
    let currentAngle = -90; // Start from top
    
    return expenses.map((expense, index) => {
      const percentage = (expense.amount / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      return {
        ...expense,
        percentage,
        startAngle,
        angle,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      };
    });
  }, [expenses, total]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (expenses.length === 0 || total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No hay gastos este mes</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gastos por Categoría</Text>
      
      <View style={styles.chartContainer}>
        <Svg width={CHART_SIZE} height={CHART_SIZE}>
          <G>
            {chartData.map((item, index) => (
              <Circle
                key={index}
                cx={CHART_SIZE / 2}
                cy={CHART_SIZE / 2}
                r={RADIUS}
                stroke={item.color}
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={`${(item.angle / 360) * (2 * Math.PI * RADIUS)} ${2 * Math.PI * RADIUS}`}
                strokeDashoffset={-((item.startAngle + 90) / 360) * (2 * Math.PI * RADIUS)}
                strokeLinecap="round"
              />
            ))}
          </G>
        </Svg>
        
        <View style={styles.centerLabel}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(total)}</Text>
        </View>
      </View>

      <View style={styles.legend}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={styles.legendLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendIcon}>{item.icon}</Text>
              <Text style={styles.legendCategory}>{item.category}</Text>
            </View>
            <View style={styles.legendRight}>
              <Text style={styles.legendAmount}>{formatCurrency(item.amount)}</Text>
              <Text style={styles.legendPercentage}>{item.percentage.toFixed(1)}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  legend: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  legendCategory: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  legendPercentage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
