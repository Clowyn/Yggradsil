import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Profile, Locale } from '../lib/types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: Profile | null;
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

  const isGM = profile?.role === 'gm';

  // Listen for auth state changes
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? '' });
          await fetchProfile(session.user.id);
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
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
      } else {
        setProfile(data);
        if (data.locale) {
          setLocale(data.locale as Locale);
        }
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSetLocale = async (newLocale: Locale) => {
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
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
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

    // 2. Determine if this is the first profile (make it GM if it is, else Player)
    let role: 'gm' | 'player' = 'player';
    try {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (count === 0) {
        role = 'gm';
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
  };

  const signOut = async () => {
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
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isGM,
        loading,
        locale,
        setLocale: handleSetLocale,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

