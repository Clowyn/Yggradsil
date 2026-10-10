import { chromium } from '@playwright/test';
import { preview } from 'vite';
import path from 'path';
import fs from 'fs';

/**
 * Empirical Load Time Benchmark Script
 * Measures Before (Baseline commit 23e1e9c) vs After (Current State)
 * Metrics collected via PerformanceNavigationTiming & PerformancePaintTiming:
 * - First Contentful Paint (FCP)
 * - DOMContentLoaded
 * - window.onload (loadEventEnd)
 */

function calculateStats(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const mean = Math.round((sorted.reduce((acc, v) => acc + v, 0) / sorted.length) * 10) / 10;
  return { min, max, median, mean, raw: sorted };
}

async function measureServer(name, rootDir, port, runs = 5) {
  console.log(`\n==================================================`);
  console.log(`Starting ${name} Preview Server on port ${port}...`);
  console.log(`Root directory: ${rootDir}`);
  console.log(`==================================================`);

  const server = await preview({
    root: rootDir,
    preview: {
      port,
      host: '127.0.0.1',
    },
  });

  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Server listening at: ${baseUrl}`);

  const browser = await chromium.launch({ headless: true });
  const fcpList = [];
  const dclList = [];
  const loadList = [];

  try {
    for (let i = 1; i <= runs; i++) {
      // Fresh context per run to avoid cache skewing initial load
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(`${baseUrl}/`, { waitUntil: 'load' });
      await page.waitForTimeout(300); // Allow paint entries to settle

      const metrics = await page.evaluate(async () => {
        // Wait for FCP if not yet present
        if (performance.getEntriesByName('first-contentful-paint').length === 0) {
          await new Promise((resolve) => {
            const observer = new PerformanceObserver((list) => {
              if (list.getEntriesByName('first-contentful-paint').length > 0) {
                observer.disconnect();
                resolve();
              }
            });
            try {
              observer.observe({ type: 'paint', buffered: true });
            } catch {
              // fallback
            }
            setTimeout(resolve, 1500);
          });
        }

        const fcp = performance.getEntriesByName('first-contentful-paint')[0];
        const nav = performance.getEntriesByType('navigation')[0];

        return {
          fcp: fcp ? Math.round(fcp.startTime) : null,
          dcl: nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null,
          load: nav ? Math.round(nav.loadEventEnd - nav.startTime) : null,
        };
      });

      console.log(`Run ${i}/${runs} [${name}]: FCP = ${metrics.fcp}ms | DCL = ${metrics.dcl}ms | Load = ${metrics.load}ms`);
      if (metrics.fcp !== null) fcpList.push(metrics.fcp);
      if (metrics.dcl !== null) dclList.push(metrics.dcl);
      if (metrics.load !== null) loadList.push(metrics.load);

      await context.close();
    }
  } finally {
    await browser.close();
    server.httpServer.close();
  }

  return {
    name,
    fcp: calculateStats(fcpList),
    dcl: calculateStats(dclList),
    load: calculateStats(loadList),
  };
}

async function main() {
  const runs = 5;
  const baselineDir = path.resolve('../dnd-baseline');
  const currentDir = path.resolve('.');

  if (!fs.existsSync(baselineDir)) {
    console.error(`Error: Baseline directory not found at ${baselineDir}. Please create worktree: git worktree add ../dnd-baseline 23e1e9c`);
    process.exit(1);
  }

  console.log(`Starting empirical measurement (${runs} runs each)...`);

  // Measure Baseline (Before) on port 4174
  const beforeResults = await measureServer('Before (Baseline 23e1e9c)', baselineDir, 4174, runs);

  // Measure Current (After) on port 4175
  const afterResults = await measureServer('After (Current State)', currentDir, 4175, runs);

  console.log('\n\n==================================================');
  console.log('EMPIRICAL BENCHMARK MEASUREMENT RESULTS (5 RUNS)');
  console.log('==================================================\n');

  console.log('--- Baseline (Before 23e1e9c) ---');
  console.log('FCP (ms):', beforeResults.fcp);
  console.log('DOM Content Loaded (ms):', beforeResults.dcl);
  console.log('Window Onload (ms):', beforeResults.load);

  console.log('\n--- Current State (After) ---');
  console.log('FCP (ms):', afterResults.fcp);
  console.log('DOM Content Loaded (ms):', afterResults.dcl);
  console.log('Window Onload (ms):', afterResults.load);

  const diffFcp = afterResults.fcp.median - beforeResults.fcp.median;
  const diffDcl = afterResults.dcl.median - beforeResults.dcl.median;
  const diffLoad = afterResults.load.median - beforeResults.load.median;

  console.log('\n--- Median Comparison ---');
  console.log(`FCP:        Before = ${beforeResults.fcp.median}ms | After = ${afterResults.fcp.median}ms | Diff = ${diffFcp >= 0 ? '+' : ''}${diffFcp}ms`);
  console.log(`DCL:        Before = ${beforeResults.dcl.median}ms | After = ${afterResults.dcl.median}ms | Diff = ${diffDcl >= 0 ? '+' : ''}${diffDcl}ms`);
  console.log(`Load Event: Before = ${beforeResults.load.median}ms | After = ${afterResults.load.median}ms | Diff = ${diffLoad >= 0 ? '+' : ''}${diffLoad}ms`);

  // Output formatted markdown snippet
  console.log('\n\n--- MARKDOWN SUMMARY FOR R3_PERFORMANCE_AUDIT.md ---');
  console.log(`
| Zamanlama Metriği (Timing Metric) | Önce (Baseline 23e1e9c) [Min / Medyan / Maks] | Sonra (Current State) [Min / Medyan / Maks] | Medyan Değişim |
|---|:---:|:---:|:---:|
| **First Contentful Paint (FCP)** | ${beforeResults.fcp.min} ms / **${beforeResults.fcp.median} ms** / ${beforeResults.fcp.max} ms | ${afterResults.fcp.min} ms / **${afterResults.fcp.median} ms** / ${afterResults.fcp.max} ms | ${diffFcp <= 0 ? `${Math.abs(diffFcp)} ms hızlanma` : `+${diffFcp} ms`} |
| **DOMContentLoaded (DCL)** | ${beforeResults.dcl.min} ms / **${beforeResults.dcl.median} ms** / ${beforeResults.dcl.max} ms | ${afterResults.dcl.min} ms / **${afterResults.dcl.median} ms** / ${afterResults.dcl.max} ms | ${diffDcl <= 0 ? `${Math.abs(diffDcl)} ms hızlanma` : `+${diffDcl} ms`} |
| **window.onload (Load Complete)** | ${beforeResults.load.min} ms / **${beforeResults.load.median} ms** / ${beforeResults.load.max} ms | ${afterResults.load.min} ms / **${afterResults.load.median} ms** / ${afterResults.load.max} ms | ${diffLoad <= 0 ? `${Math.abs(diffLoad)} ms hızlanma` : `+${diffLoad} ms`} |
`);
}

main().catch((err) => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
