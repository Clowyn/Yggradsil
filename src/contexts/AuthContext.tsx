import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import type { Profile, Locale, UserRole } from '../lib/types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  isAdmin: boolean;
  isGM: boolean;
  loading: boolean;
  locale: Locale;
  setLocale: (l: Locale) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [locale, setLocale] = useState<Locale>('en');

  const isAdmin = profile?.role === 'admin';
  const isGM = profile?.role === 'gm' || profile?.role === 'admin';

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setProfile(data);
        if (data.locale) {
          setLocale(data.locale as Locale);
        }
      } else {
        console.warn('Profile record missing for user, creating default profile...');
        let role: UserRole = 'player';
        try {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });
          if (count === 0) {
            role = 'admin';
          }
        } catch {
          // ignore
        }

        const username = email ? email.split('@')[0] : 'Adventurer';
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            username,
            role,
            locale,
          })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile);
        } else {
          setProfile(null);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  // Listen for auth state changes
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? '' });
          await fetchProfile(session.user.id, session.user.email);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
        setLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
        await fetchProfile(session.user.id, session.user.email);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const handleSetLocale = useCallback(async (newLocale: Locale) => {
    setLocale(newLocale);
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ locale: newLocale })
          .eq('id', user.id);
      } catch (err) {
        console.error('Failed to save locale preference:', err);
      }
    }
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, username: string) => {
    setLoading(true);
    // 1. Sign up user in Supabase auth
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setLoading(false);
      throw authError;
    }
    if (!data.user) {
      setLoading(false);
      throw new Error('Sign up failed: no user returned.');
    }

    // 2. Determine initial role: first registered user becomes 'admin', subsequent users are 'player'
    let role: UserRole = 'player';
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (count === 0) {
        role = 'admin';
      }
    } catch (err) {
      console.warn('Could not count profiles, defaulting to player:', err);
    }

    // 3. Create profile in database
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      username,
      role,
      locale,
    });

    if (profileError) {
      setLoading(false);
      throw profileError;
    }
  }, [locale]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthState>(() => ({
    user,
    profile,
    isAdmin,
    isGM,
    loading,
    locale,
    setLocale: handleSetLocale,
    signIn,
    signUp,
    signOut,
  }), [user, profile, isAdmin, isGM, loading, locale, handleSetLocale, signIn, signUp, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

