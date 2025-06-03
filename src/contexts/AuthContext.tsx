
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'agent' | 'demenageur';
  company_name?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to validate and sanitize profile data
const allowedRoles = ['admin', 'agent', 'demenageur'] as const;
type AllowedRole = typeof allowedRoles[number];

function sanitizeProfile(profileData: any): Profile | null {
  if (!profileData || !allowedRoles.includes(profileData.role)) {
    console.warn(`Invalid role ignored: ${profileData?.role}`);
    return null;
  }

  return {
    id: profileData.id,
    email: profileData.email,
    role: profileData.role as AllowedRole,
    company_name: profileData.company_name,
  };
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User logged in, fetching profile...');
          // Try to fetch profile, but don't block login if it fails
          try {
            await fetchProfile(session.user.id);
          } catch (error) {
            console.warn('Profile fetch failed, but user is still logged in:', error);
            // Create a default profile for admin user if profile fetch fails
            if (session.user.email === 'contact@matchmove.fr') {
              console.log('Setting default admin profile');
              setProfile({
                id: session.user.id,
                email: session.user.email,
                role: 'admin',
                company_name: undefined
              });
            }
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).catch((error) => {
          console.warn('Initial profile fetch failed:', error);
          // Create a default profile for admin user if profile fetch fails
          if (session.user.email === 'contact@matchmove.fr') {
            console.log('Setting default admin profile on initial load');
            setProfile({
              id: session.user.id,
              email: session.user.email,
              role: 'admin',
              company_name: undefined
            });
          }
        });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    console.log('Fetching profile for user:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }

      console.log('Profile data received:', data);
      const sanitizedProfile = sanitizeProfile(data);
      if (sanitizedProfile) {
        setProfile(sanitizedProfile);
        console.log('Profile set successfully:', sanitizedProfile);
      } else {
        console.warn('Profile data could not be sanitized');
        throw new Error('Invalid profile data');
      }
    } catch (error) {
      console.error('Profile fetch failed:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('Attempting sign in for:', email);
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      console.log('Sign in successful');
      // Don't set loading to false here, let the auth state change handle it
    }

    return { error };
  };

  const signUp = async (email: string, password: string, role: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signOut = async () => {
    console.log('Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user' };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
    }

    return { error };
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
