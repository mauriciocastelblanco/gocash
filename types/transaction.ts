
export type TransactionType = 'expense' | 'income';
export type PaymentMethod = 'debit' | 'credit' | 'cash';

export interface MainCategory {
  id: string;
  nombre: string;
  tipo: 'expense' | 'income';
  icono: string | null;
}

export interface Subcategory {
  id: string;
  main_category_id: string;
  nombre: string;
  tipo: 'expense' | 'income';
  user_id: string | null;
  workspace_id: string | null;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  mainCategoryId: string;
  mainCategoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  paymentMethod: PaymentMethod;
  date: Date;
  createdAt: Date;
  installments?: number;
  installmentNumber?: number;
}
