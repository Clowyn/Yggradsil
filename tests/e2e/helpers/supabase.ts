import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, getAuthenticatedSession } from './auth';

/**
 * Creates an anonymous Supabase client using anon key without user session.
 */
export function getAnonSupabaseClient(): SupabaseClient {
  return createClient(SUPABASE_CONFIG.supabaseUrl, SUPABASE_CONFIG.supabaseAnonKey);
}

/**
 * Convenience alias for general querying.
 */
export function getSupabaseClient(): SupabaseClient {
  return getAnonSupabaseClient();
}

/**
 * Creates an authentic Supabase client authenticated as the specified role.
 * Obtains genuine session via signInWithPassword and attaches real user JWT Bearer token.
 * Does NOT forge tokens or inject anon keys.
 */
export async function getAuthenticatedSupabaseClient(role: 'gm' | 'player' = 'player'): Promise<SupabaseClient> {
  const session = await getAuthenticatedSession(role);
  return createClient(SUPABASE_CONFIG.supabaseUrl, SUPABASE_CONFIG.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    },
  });
}

/**
 * Names of the GM-only tables specified in PROJECT.md and ORIGINAL_REQUEST.md
 */
export const GM_TABLES = [
  'campaign_encounters',
  'encounter_combatants',
  'campaign_environments',
  'session_chronicles',
  'campaign_loot_chests',
] as const;

export type GMTableName = (typeof GM_TABLES)[number];
