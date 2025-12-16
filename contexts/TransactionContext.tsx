
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod, Category } from '@/types/transaction';

interface TransactionContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getMonthlyTransactions: (year: number, month: number) => Transaction[];
  getMonthlyTotal: (year: number, month: number, type?: TransactionType) => number;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    // Load transactions from storage or Supabase
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      // TODO: Replace with Supabase query
      console.log('Loading transactions');
    } catch (error) {
      console.log('Error loading transactions:', error);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const newTransaction: Transaction = {
        ...transaction,
        id: Date.now().toString(),
        createdAt: new Date(),
      };
      
      // TODO: Replace with Supabase insert
      console.log('Adding transaction:', newTransaction);
      setTransactions(prev => [newTransaction, ...prev]);
    } catch (error) {
      console.log('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      // TODO: Replace with Supabase delete
      console.log('Deleting transaction:', id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.log('Error deleting transaction:', error);
      throw error;
    }
  };

  const getMonthlyTransactions = (year: number, month: number): Transaction[] => {
    return transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  };

  const getMonthlyTotal = (year: number, month: number, type?: TransactionType): number => {
    const monthlyTransactions = getMonthlyTransactions(year, month);
    return monthlyTransactions
      .filter(t => !type || t.type === type)
      .reduce((sum, t) => sum + (t.type === 'expense' ? -t.amount : t.amount), 0);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        deleteTransaction,
        getMonthlyTransactions,
        getMonthlyTotal,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}
