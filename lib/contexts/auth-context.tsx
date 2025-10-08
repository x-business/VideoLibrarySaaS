'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { prisma } from '@/lib/prisma';

interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(status === 'loading');
  }, [status]);

  const handleSignIn = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { error: { message: 'Invalid email or password' } };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: { message: 'An error occurred during sign in' } };
    }
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      // Check if user already exists
      const existingUser = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (existingUser.ok) {
        const { exists } = await existingUser.json();
        if (exists) {
          return { error: { message: 'User already exists with this email' } };
        }
      }

      // Create new user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { error: { message: error.message || 'Failed to create account' } };
      }

      // Sign in the new user
      return await handleSignIn(email, password);
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: { message: 'An error occurred during sign up' } };
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
  };

  const user: User | null = session?.user ? {
    id: session.user.id,
    email: session.user.email!,
    role: session.user.role as 'USER' | 'ADMIN',
  } : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
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
