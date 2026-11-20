import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  provider: string | null;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function extractProfileFromUser(user: User): UserProfile {
  const meta = user.user_metadata || {};
  const appMeta = user.app_metadata || {};
  return {
    id: user.id,
    email: user.email ?? null,
    full_name:
      (meta.full_name as string | undefined) ||
      (meta.name as string | undefined) ||
      null,
    avatar_url:
      (meta.avatar_url as string | undefined) ||
      (meta.picture as string | undefined) ||
      null,
    provider: (appMeta.provider as string | undefined) || 'google',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const syncUserToDatabase = useCallback(async (authUser: User) => {
    const derived = extractProfileFromUser(authUser);
    setProfile(derived);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            id: authUser.id,
            email: derived.email,
            full_name: derived.full_name,
            avatar_url: derived.avatar_url,
            provider: derived.provider,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
        .select('id, email, full_name, avatar_url, provider')
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch {
      // Keep derived profile if network/table sync fails transiently
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      try {
        const supabase = createClient();

        // Handle OAuth PKCE code or hash tokens returned in URL
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const code = url.searchParams.get('code');
          const hashParams = new URLSearchParams(
            url.hash.startsWith('#') ? url.hash.slice(1) : ''
          );
          const hashAccessToken = hashParams.get('access_token');
          const hashRefreshToken = hashParams.get('refresh_token');
          const oauthError =
            url.searchParams.get('error_description') ||
            url.searchParams.get('error') ||
            hashParams.get('error_description') ||
            hashParams.get('error');

          if (oauthError && isMounted) {
            setAuthError(oauthError);
          }

          if (code) {
            await supabase.auth.exchangeCodeForSession(code).catch(() => {});
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            window.history.replaceState(
              {},
              '',
              url.pathname === '/auth' ? '/' : url.pathname + url.search
            );
          } else if (hashAccessToken && hashRefreshToken) {
            await supabase.auth
              .setSession({
                access_token: hashAccessToken,
                refresh_token: hashRefreshToken,
              })
              .catch(() => {});
            window.history.replaceState(
              {},
              '',
              url.pathname === '/auth' ? '/' : url.pathname + url.search
            );
          }
        }

        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;

        const currentSession = data.session ?? null;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await syncUserToDatabase(currentSession.user);
        } else {
          setProfile(null);
        }

        const { data: listener } = supabase.auth.onAuthStateChange(
          async (event, nextSession) => {
            if (!isMounted) return;
            setSession(nextSession);
            setUser(nextSession?.user ?? null);

            if (nextSession?.user) {
              await syncUserToDatabase(nextSession.user);
              if (
                event === 'SIGNED_IN' &&
                typeof window !== 'undefined' &&
                window.location.pathname === '/auth'
              ) {
                window.history.replaceState({}, '', '/');
              }
            } else {
              setProfile(null);
            }
          }
        );

        unsubscribe = () => listener.subscription.unsubscribe();
      } catch {
        // Gracefully handle missing Supabase config in offline/test contexts
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [syncUserToDatabase]);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) {
        setAuthError(error.message);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Google 로그인을 시작하지 못했습니다.'
      );
    }
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore client errors on signout
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      isAuthenticated: Boolean(user),
      loading,
      authError,
      signInWithGoogle,
      signOut,
      clearAuthError,
    }),
    [user, session, profile, loading, authError, signInWithGoogle, signOut, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
