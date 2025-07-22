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
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing auth...');
        
        // Get initial session with shorter timeout
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error && !error.message?.includes('session')) {
          console.error('❌ Error getting session:', error);
        } else {
          console.log('✅ Session retrieved:', session?.user?.email || 'No session');
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Load profile in background without blocking
            loadUserProfile(session.user);
          } else {
            setProfile(null);
          }
          
          // Set loading to false immediately after session check
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && event !== 'TOKEN_REFRESHED') {
          loadUserProfile(session.user);
        } else if (!session) {
          setProfile(null);
        }
        
        // Always stop loading on auth state change (except token refresh)
        if (event !== 'TOKEN_REFRESHED') {
          setLoading(false);
        }
      }
    );

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (user: User) => {
    try {
      console.log('👤 Loading profile for:', user.email);
      
      // Special handling for original admin users
      if (user.email === 'contact@matchmove.fr' || user.email === 'pierre@matchmove.fr') {
        console.log('👑 Original admin user detected');
        const adminProfile: Profile = {
          id: user.id,
          email: user.email,
          role: 'admin',
          company_name: 'MatchMove'
        };
        setProfile(adminProfile);
        console.log('✅ Admin profile set:', adminProfile);
        return;
      }

      // For all other users, fetch from database
      try {
        const { data: profileData, error } = await Promise.race([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
          )
        ]) as any;

        if (error) {
          console.error('❌ Error fetching profile:', error);
          await createDefaultProfile(user);
          return;
        }

        if (profileData) {
          const profile: Profile = {
            id: profileData.id,
            email: profileData.email,
            role: profileData.role as 'admin' | 'agent' | 'demenageur',
            company_name: profileData.company_name
          };
          setProfile(profile);
          console.log('✅ Profile loaded from DB:', profile);
        } else {
          console.log('📝 No profile found, creating default...');
          await createDefaultProfile(user);
        }
      } catch (fetchError: any) {
        console.log('⏰ Profile fetch failed/timeout, using fallback');
        await createDefaultProfile(user);
      }
    } catch (error) {
      console.error('❌ Profile loading error:', error);
      await createDefaultProfile(user);
    }
  };

  const createDefaultProfile = async (user: User) => {
    try {
      console.log('📝 Creating default profile for:', user.email);
      
      const defaultProfile: Profile = {
        id: user.id,
        email: user.email,
        role: 'agent',
        company_name: undefined
      };

      // Try to insert into database without blocking
      supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          role: 'agent',
          company_name: null
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .then(({ error }) => {
          if (error) {
            console.error('❌ Error upserting profile in DB:', error);
          } else {
            console.log('✅ Default profile upserted in DB successfully');
          }
        });

      // Always set the profile locally immediately
      setProfile(defaultProfile);
      console.log('✅ Default profile set locally:', defaultProfile);
    } catch (error) {
      console.error('❌ Error creating default profile:', error);
      // Always provide fallback
      setProfile({
        id: user.id,
        email: user.email,
        role: 'agent',
        company_name: undefined
      });
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return { error };
    }

    console.log('✅ Sign in successful');
    // Loading will be set to false by auth state change
    return { error: null };
  };

  const signUp = async (email: string, password: string, role: string) => {
    console.log('📝 Attempting sign up for:', email);
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role,
        }
      }
    });

    if (error) {
      console.error('❌ Sign up error:', error);
      toast({
        title: "Erreur d'inscription",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log('✅ Sign up successful');
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès",
      });
    }

    return { error };
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('📤 Active session found, signing out...');
        const { error } = await supabase.auth.signOut();
        
        if (error && !error.message?.includes('session') && !error.message?.includes('Session')) {
          console.error('❌ Sign out error:', error);
          toast({
            title: "Erreur de déconnexion",
            description: error.message,
            variant: "destructive",
          });
        } else {
          console.log('✅ Sign out successful');
        }
      } else {
        console.log('📭 No active session found, clearing local state...');
      }
    } catch (error: any) {
      console.error('❌ Sign out error:', error);
      if (!error.message?.includes('session') && !error.message?.includes('Session')) {
        toast({
          title: "Erreur de déconnexion",
          description: error.message,
          variant: "destructive",
        });
      }
    }
    
    console.log('🧹 Clearing local auth state...');
    setUser(null);
    setSession(null);
    setProfile(null);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user' };

    console.log('🔄 Updating profile:', updates);

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      console.log('✅ Profile updated:', updatedProfile);
    } else if (error) {
      console.error('❌ Profile update error:', error);
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
