
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/app/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { useRouter, useSegments } from 'expo-router';

interface SignUpData {
  email: string;
  password: string;
  nombre: string;
  numero_celular?: string;
  codigo_celular?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    console.log('[AuthContext] Initializing auth...');
    
    // Check for existing session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthContext] Error getting session:', error);
        } else {
          console.log('[AuthContext] Session check:', session ? 'Found session' : 'No session');
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('[AuthContext] Error in getSession:', error);
      } finally {
        setIsLoading(false);
        console.log('[AuthContext] Auth initialization complete');
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthContext] Auth state changed:', event, session ? 'has session' : 'no session');
      
      // Update state immediately
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      // Handle navigation based on auth event
      if (event === 'SIGNED_IN' && session) {
        console.log('[AuthContext] User signed in, navigating to home...');
        // Use setTimeout to ensure navigation happens after state update
        setTimeout(() => {
          router.replace('/(tabs)/(home)/');
        }, 100);
      } else if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] User signed out, navigating to login...');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 100);
      }
    });

    return () => {
      console.log('[AuthContext] Cleaning up subscription');
      subscription.unsubscribe();
    };
  }, []);

  // Protected route logic
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    console.log('[AuthContext] Route protection check:', {
      hasUser: !!user,
      inAuthGroup,
      inTabsGroup,
      segments,
    });

    if (!user && !inAuthGroup && segments.length > 0) {
      // User is not authenticated and not in auth screens
      console.log('[AuthContext] Unauthorized access, redirecting to login...');
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // User is authenticated but in auth screens
      console.log('[AuthContext] Already authenticated, redirecting to home...');
      router.replace('/(tabs)/(home)/');
    }
  }, [user, isLoading, segments]);

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] Signing in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AuthContext] Sign in error:', error);
      throw error;
    }

    console.log('[AuthContext] Sign in successful');
    // State update and navigation will be handled by onAuthStateChange
  };

  const signUp = async (data: SignUpData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { email, password, nombre, numero_celular, codigo_celular } = data;

      console.log('[AuthContext] Starting sign up process...');

      // Check if email exists
      console.log('[AuthContext] Checking if email exists...');
      const { data: emailExists, error: emailCheckError } = await supabase
        .rpc('check_email_exists', { email_to_check: email.toLowerCase() });
      
      if (emailCheckError) {
        console.error('[AuthContext] Error checking email:', emailCheckError);
        return { success: false, error: 'Error al verificar el email' };
      }

      if (emailExists) {
        console.log('[AuthContext] Email already exists');
        return { success: false, error: 'Este email ya está registrado' };
      }

      // Check if phone exists (if provided)
      if (numero_celular && numero_celular.trim() !== '') {
        console.log('[AuthContext] Checking if phone exists...');
        const { data: phoneExists, error: phoneCheckError } = await supabase
          .rpc('check_phone_exists', { phone_to_check: numero_celular });
        
        if (phoneCheckError) {
          console.error('[AuthContext] Error checking phone:', phoneCheckError);
          return { success: false, error: 'Error al verificar el teléfono' };
        }

        if (phoneExists) {
          console.log('[AuthContext] Phone already exists');
          return { success: false, error: 'Este número ya está registrado' };
        }
      }

      // Execute signUp in Supabase Auth
      console.log('[AuthContext] Creating account...');
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre: nombre.trim(),
            numero_celular: numero_celular || '',
            codigo_celular: codigo_celular || '+56',
          }
        }
      });

      if (error) {
        console.error('[AuthContext] Sign up error:', error);
        return { success: false, error: error.message };
      }

      console.log('[AuthContext] Sign up successful');
      return { success: true };
    } catch (error: any) {
      console.error('[AuthContext] Unexpected error during sign up:', error);
      return { success: false, error: 'Ocurrió un error inesperado' };
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthContext] Starting sign out process...');
      
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthContext] Sign out error:', error);
        throw error;
      }

      console.log('[AuthContext] Sign out from Supabase successful');
      // State update and navigation will be handled by onAuthStateChange
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
      // Clear local state even if there's an error to ensure user is logged out
      setSession(null);
      setUser(null);
      throw error;
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  console.log('[AuthContext] Rendering with state:', {
    hasUser: !!user,
    isLoading,
    userId: user?.id,
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
