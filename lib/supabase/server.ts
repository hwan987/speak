import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export interface ServerClientOptions {
  cookies?: CookieMethodsServer;
  useServiceRole?: boolean;
}

export function createClient(options?: ServerClientOptions) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error('Missing environment variable: NEXT_PUBLIC_SUPABASE_URL.');
  }

  if (options?.useServiceRole) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY.');
    }

    return createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseKey) {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: options?.cookies ?? {
      getAll() {
        return [];
      },
      setAll() {},
    },
  });
}

export function createAdminClient() {
  return createClient({ useServiceRole: true });
}
