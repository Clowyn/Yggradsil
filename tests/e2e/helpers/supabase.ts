import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, TEST_USERS } from './auth';

/**
 * Creates a Supabase client using anon key.
 */
export function getSupabaseClient(): SupabaseClient {
  return createClient(SUPABASE_CONFIG.supabaseUrl, SUPABASE_CONFIG.supabaseAnonKey);
}

/**
 * Creates a Supabase client authenticated as a specific user with custom Bearer token header or session.
 */
export function getAuthenticatedClient(role: 'gm' | 'player' = 'player'): SupabaseClient {
  const user = TEST_USERS[role];
  return createClient(SUPABASE_CONFIG.supabaseUrl, SUPABASE_CONFIG.supabaseAnonKey, {
    global: {
      headers: {
        // Pass user identifier for mock test isolation if configured
        'x-test-user-id': user.id,
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

export type GMTableName = typeof GM_TABLES[number];
