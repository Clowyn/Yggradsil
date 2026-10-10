import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Read Supabase config safely from .env.local without exposing credentials
function loadSupabaseConfig() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local file not found in project root.');
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*)/);

  const supabaseUrl = urlMatch ? urlMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';
  const supabaseAnonKey = keyMatch ? keyMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';

  const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || 'localhost';
  const storageKey = `sb-${projectRef}-auth-token`;

  return { supabaseUrl, supabaseAnonKey, projectRef, storageKey };
}

export const SUPABASE_CONFIG = loadSupabaseConfig();

export interface TestUser {
  id: string;
  username: string;
  email: string;
  role: 'gm' | 'player' | 'admin';
}

export const TEST_USERS = {
  gm: {
    id: '092418bf-d638-4329-ac49-7404e442c85b',
    username: 'Alcyone',
    email: 'alcyone@example.com',
    role: 'gm' as const,
  },
  player: {
    id: 'b86cd534-eb67-46fa-9ad0-6c5e63d4ae42',
    username: 'Bob Valor',
    email: 'bob.valor@example.com',
    role: 'player' as const,
  },
  admin: {
    id: '092418bf-d638-4329-ac49-7404e442c85b',
    username: 'Alcyone',
    email: 'alcyone@example.com',
    role: 'admin' as const,
  },
};

/**
 * Injects an authenticated Supabase session into browser localStorage
 * before navigation. Guarantees deterministic, instant authentication without
 * hitting Supabase Auth email rate limits.
 */
export async function setupAuthSession(page: Page, userType: 'gm' | 'player' | 'admin') {
  const user = TEST_USERS[userType];
  const { storageKey, supabaseAnonKey } = SUPABASE_CONFIG;

  await page.addInitScript(
    ({ key, anonKey, userData }) => {
      const session = {
        access_token: anonKey,
        refresh_token: 'e2e-test-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
        expires_in: 86400 * 30,
        token_type: 'bearer',
        user: {
          id: userData.id,
          aud: 'authenticated',
          role: 'authenticated',
          email: userData.email,
          email_confirmed_at: '2026-10-10T12:00:00Z',
          user_metadata: {
            username: userData.username,
          },
          app_metadata: {
            provider: 'email',
            providers: ['email'],
          },
        },
      };
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    { key: storageKey, anonKey: supabaseAnonKey, userData: user }
  );
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
        text.includes('Failed to load resource: the server responded with a status of 404 (Not Found)') && text.includes('favicon.ico')
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
