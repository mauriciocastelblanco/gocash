
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    // This will be replaced with Supabase auth check
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      // TODO: Replace with Supabase auth check
      // For now, just set loading to false
      setIsLoading(false);
    } catch (error) {
      console.log('Error checking user:', error);
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // TODO: Replace with Supabase auth
      // For now, just simulate login
      console.log('Signing in with:', email);
      setUser({ id: '1', email });
    } catch (error) {
      console.log('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // TODO: Replace with Supabase auth
      console.log('Signing out');
      setUser(null);
    } catch (error) {
      console.log('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
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
