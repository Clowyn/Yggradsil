import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
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
  const localeRef = useRef<Locale>(locale);
  useEffect(() => {
    localeRef.current = locale;
  }, [locale]);

  const isAdmin = profile?.role === 'admin';
  const isGM = profile?.role === 'gm' || profile?.role === 'admin';

  // In-flight profile fetch deduplication map
  const inFlightProfileFetchRef = useRef<Map<string, Promise<Profile | null>>>(new Map());

  const fetchProfile = useCallback(async (userId: string, email?: string, metaUsername?: string) => {
    if (inFlightProfileFetchRef.current.has(userId)) {
      return inFlightProfileFetchRef.current.get(userId);
    }

    const fetchPromise = (async () => {
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
          return data;
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

          const username = metaUsername?.trim() || (email ? email.split('@')[0] : 'Adventurer');
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              username,
              role,
              locale: localeRef.current,
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            setProfile(newProfile);
            return newProfile;
          } else {
            setProfile(null);
            return null;
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
        setProfile(null);
        return null;
      } finally {
        setLoading(false);
        inFlightProfileFetchRef.current.delete(userId);
      }
    })();

    inFlightProfileFetchRef.current.set(userId, fetchPromise);
    return fetchPromise;
  }, []);

  // Listen for auth state changes with de-duplicated initial session
  useEffect(() => {
    let isMounted = true;
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 6000);

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session?.user) {
          setUser({ id: session.user.id, email: session.user.email ?? '' });
          const metaUsername = typeof session.user.user_metadata?.username === 'string' ? session.user.user_metadata.username : undefined;
          await fetchProfile(session.user.id, session.user.email, metaUsername);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error checking auth session:', err);
        if (isMounted) setLoading(false);
      } finally {
        clearTimeout(safetyTimer);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      // Skip redundant initial event since checkSession handles it with local cache
      if (event === 'INITIAL_SESSION') return;

      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' });
        const metaUsername = typeof session.user.user_metadata?.username === 'string' ? session.user.user_metadata.username : undefined;
        await fetchProfile(session.user.id, session.user.email, metaUsername);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
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
    // 1. Sign up user in Supabase auth (persist username & locale in metadata so it survives email confirmation)
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username.trim(),
          locale,
        },
      },
    });
    if (authError) {
      setLoading(false);
      throw authError;
    }
    if (!data.user) {
      setLoading(false);
      throw new Error('Sign up failed: no user returned.');
    }

    // If Supabase "Confirm email" is enabled, data.session is null until the user clicks the email link.
    // Do not attempt an unauthenticated profiles insert (which would fail RLS and cause repeated clicks/rate-limits);
    // fetchProfile will automatically create the profile row upon first confirmed sign-in.
    if (!data.session) {
      setLoading(false);
      throw new Error('CONFIRM_EMAIL_REQUIRED');
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

    // 3. Create profile in database (upsert to avoid duplicate key if trigger/auth state already created it)
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      username: username.trim() || email.split('@')[0],
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

