
export type TransactionType = 'expense' | 'income';
export type PaymentMethod = 'debit' | 'credit' | 'cash';

export interface Category {
  id: string;
  name: string;
  emoji: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  category: Category;
  paymentMethod: PaymentMethod;
  date: Date;
  createdAt: Date;
  installments?: number;
  installmentNumber?: number;
}

export const CATEGORIES: Category[] = [
  { id: 'supermarket', name: 'Supermercado', emoji: '🛒' },
  { id: 'restaurant', name: 'Restaurante', emoji: '🍽️' },
  { id: 'transport', name: 'Transporte', emoji: '🚗' },
  { id: 'health', name: 'Salud', emoji: '💊' },
  { id: 'entertainment', name: 'Entretenimiento', emoji: '🎬' },
  { id: 'home', name: 'Hogar', emoji: '🏠' },
  { id: 'education', name: 'Educación', emoji: '📚' },
  { id: 'other', name: 'Otros', emoji: '💰' },
];
