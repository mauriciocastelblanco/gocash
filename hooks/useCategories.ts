
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getUserActiveWorkspace } from '@/lib/transactions';

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
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[useCategories] Loading categories for user:', user.id);

      // Get user's active workspace
      const activeWorkspaceId = await getUserActiveWorkspace(user.id);
      console.log('[useCategories] Active workspace:', activeWorkspaceId);
      setWorkspaceId(activeWorkspaceId);

      // Load main categories (these are global, not workspace-specific)
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

      // Load subcategories for the user's active workspace
      if (activeWorkspaceId) {
        const { data: subcategoriesData, error: subcategoriesError } = await supabase
          .from('subcategories')
          .select('*')
          .eq('workspace_id', activeWorkspaceId)
          .order('nombre');

        if (subcategoriesError) {
          console.error('[useCategories] Error loading subcategories:', subcategoriesError);
          throw subcategoriesError;
        }

        console.log('[useCategories] Loaded subcategories:', subcategoriesData?.length);
        setSubcategories(subcategoriesData || []);
      } else {
        console.log('[useCategories] No active workspace, loading user subcategories');
        // Fallback to user_id if no workspace
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
      }
    } catch (err: any) {
      console.error('[useCategories] Error:', err);
      setError(err.message || 'Error loading categories');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user, loadCategories]);

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
    workspaceId,
    getSubcategoriesByMainCategory,
    getMainCategoriesByType,
    refreshCategories: loadCategories,
  };
}
