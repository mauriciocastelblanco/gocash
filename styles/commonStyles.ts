
import { StyleSheet } from 'react-native';

export const colors = {
  background: '#1A1A1A',
  backgroundAlt: '#2A2A2A',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  primary: '#52DF68',
  secondary: '#6A6A6A',
  accent: '#52DF68',
  card: '#2D2D2D',
  cardBackground: '#2D2D2D',
  border: '#3D3D3D',
  income: '#52DF68',
  expense: '#FF6B6B',
  highlight: '#52DF68',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export const buttonStyles = StyleSheet.create({
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
