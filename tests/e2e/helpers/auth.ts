import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, Session } from '@supabase/supabase-js';

/**
 * Supabase configuration safely loaded from environment or .env.local.
 * Strictly avoids hardcoding secrets or committing them to git.
 */
function loadSupabaseConfig() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  const getEnvVar = (key: string): string => {
    if (process.env[key]) return process.env[key]!;
    const match = envContent.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
    return match ? match[1].trim().replace(/^['"]|['"]$/g, '') : '';
  };

  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
  const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '[CONFIG ERROR] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be configured in .env.local'
    );
  }

  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'localhost';
  const storageKey = `sb-${projectRef}-auth-token`;

  return { supabaseUrl, supabaseAnonKey, projectRef, storageKey, getEnvVar };
}

export const SUPABASE_CONFIG = loadSupabaseConfig();

/**
 * Retrieves authentic test credentials from environment variables or .env.local.
 * Never injects dummy/anon tokens. Throws explicit, descriptive errors if missing.
 */
export function getCredentials(role: 'gm' | 'player') {
  const prefix = role === 'gm' ? 'E2E_GM' : 'E2E_PLAYER';
  const email = SUPABASE_CONFIG.getEnvVar(`${prefix}_EMAIL`);
  const password = SUPABASE_CONFIG.getEnvVar(`${prefix}_PASSWORD`);

  if (!email || !password) {
    throw new Error(
      `[AUTHENTICATION ERROR] Missing E2E test credentials for role '${role}'.\n` +
      `Live tests require authentic Supabase credentials.\n` +
      `Please configure ${prefix}_EMAIL and ${prefix}_PASSWORD in .env.local to execute authenticated tests.\n` +
      `Do NOT commit .env.local or expose test credentials in version control.`
    );
  }

  return { email, password };
}

// In-memory cache for valid sessions to prevent Supabase Auth email rate limits
const sessionCache: Record<string, Session> = {};

/**
 * Authenticates with Supabase Auth using real credentials via signInWithPassword.
 * Returns the genuine Session object containing authentic access_token and refresh_token.
 */
export async function getAuthenticatedSession(role: 'gm' | 'player'): Promise<Session> {
  const cached = sessionCache[role];
  if (cached && cached.expires_at) {
    // Check if session is still valid with 60 second safety buffer
    if (Date.now() / 1000 < cached.expires_at - 60) {
      return cached;
    }
  }

  const { email, password } = getCredentials(role);
  const client = createClient(SUPABASE_CONFIG.supabaseUrl, SUPABASE_CONFIG.supabaseAnonKey);

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(
      `[AUTHENTICATION ERROR] Failed to authenticate as '${role}' via Supabase Auth:\n` +
      `${error?.message || 'No session returned'}.\n` +
      `Please verify that the test account exists in Supabase and the credentials in .env.local are valid.`
    );
  }

  sessionCache[role] = data.session;
  return data.session;
}

/**
 * Injects an authentic Supabase session into browser localStorage before navigation.
 * Uses the genuine JWT session obtained from signInWithPassword.
 * BANS injecting anon keys as access_token.
 */
export async function setupAuthSession(page: Page, role: 'gm' | 'player'): Promise<Session> {
  const session = await getAuthenticatedSession(role);
  const { storageKey } = SUPABASE_CONFIG;

  await page.addInitScript(
    ({ key, sessionData }) => {
      window.localStorage.setItem(key, JSON.stringify(sessionData));
    },
    { key: storageKey, sessionData: session }
  );

  return session;
}

/**
 * Collector for uncaught console errors and page exceptions.
 * Ignores benign telemetry / devtools notices while capturing real runtime failures.
 */
export function createConsoleErrorCollector(page: Page) {
  const errors: string[] = [];

  page.on('pageerror', (err) => {
    errors.push(`[PageError] ${err.message}\n${err.stack}`);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter harmless dev notifications
      if (
        text.includes('Download the React DevTools') ||
        (text.includes('Failed to load resource: the server responded with a status of 404') &&
          text.includes('favicon.ico'))
      ) {
        return;
      }
      errors.push(`[ConsoleError] ${text}`);
    }
  });

  return {
    errors,
    clear: () => {
      errors.length = 0;
    },
    assertNoErrors: () => {
      expect(errors, `Expected 0 console/runtime errors, but found:\n${errors.join('\n')}`).toEqual([]);
    },
  };
}
