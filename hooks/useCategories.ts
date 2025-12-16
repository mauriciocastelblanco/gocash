
import { useState, useEffect } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export function useCategories() {
  const { user } = useAuth();
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  const loadCategories = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useCategories] Loading categories for user:', user.id);

      // Load main categories
      const { data: mainCategoriesData, error: mainCategoriesError } = await supabase
        .from('main_categories')
        .select('*')
        .order('nombre');

      if (mainCategoriesError) {
        console.error('[useCategories] Error loading main categories:', mainCategoriesError);
        throw mainCategoriesError;
      }

      console.log('[useCategories] Loaded main categories:', mainCategoriesData?.length);
      setMainCategories(mainCategoriesData || []);

      // Load subcategories for the user
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('subcategories')
        .select('*')
        .eq('user_id', user.id)
        .order('nombre');

      if (subcategoriesError) {
        console.error('[useCategories] Error loading subcategories:', subcategoriesError);
        throw subcategoriesError;
      }

      console.log('[useCategories] Loaded subcategories:', subcategoriesData?.length);
      setSubcategories(subcategoriesData || []);
    } catch (err: any) {
      console.error('[useCategories] Error:', err);
      setError(err.message || 'Error loading categories');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubcategoriesByMainCategory = (mainCategoryId: string): Subcategory[] => {
    return subcategories.filter((sub) => sub.main_category_id === mainCategoryId);
  };

  const getMainCategoriesByType = (type: 'expense' | 'income'): MainCategory[] => {
    return mainCategories.filter((cat) => cat.tipo === type);
  };

  return {
    mainCategories,
    subcategories,
    isLoading,
    error,
    getSubcategoriesByMainCategory,
    getMainCategoriesByType,
    refreshCategories: loadCategories,
  };
}
