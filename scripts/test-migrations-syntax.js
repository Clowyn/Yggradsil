import fs from 'fs';
import path from 'path';

const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
const migrationFiles = [
  '01_security_and_rls_hardening.sql',
  '02_schema_consistency.sql',
  '03_new_gm_modules.sql'
];

console.log('--- Validating SQL Migration Files ---');

let hasError = false;

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`[FAIL] File missing: ${file}`);
    hasError = true;
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  console.log(`Checking ${file} (${content.length} bytes)...`);

  // Check for destructive commands
  const destructiveRegex = /\b(DROP\s+TABLE|TRUNCATE|DROP\s+COLUMN)\b/i;
  const destructiveMatch = content.match(destructiveRegex);
  if (destructiveMatch) {
    console.error(`[FAIL] Dangerous destructive command found in ${file}: ${destructiveMatch[0]}`);
    hasError = true;
  }

  // Check for parentheses balance
  let openParens = 0;
  let inString = false;
  let inComment = false;
  let inDollarQuote = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1] || '';

    if (inComment) {
      if (ch === '\n') inComment = false;
      continue;
    }

    if (inDollarQuote) {
      if (ch === '$' && next === '$') {
        inDollarQuote = false;
        i++;
      }
      continue;
    }

    if (ch === '-' && next === '-') {
      inComment = true;
      i++;
      continue;
    }

    if (ch === '$' && next === '$') {
      inDollarQuote = true;
      i++;
      continue;
    }

    if (ch === "'") {
      if (!inString) inString = true;
      else if (next === "'") i++; // escaped quote
      else inString = false;
      continue;
    }

    if (!inString) {
      if (ch === '(') openParens++;
      else if (ch === ')') openParens--;
    }
  }

  if (openParens !== 0) {
    console.error(`[FAIL] Unbalanced parentheses in ${file}: diff = ${openParens}`);
    hasError = true;
  } else {
    console.log(`[PASS] ${file} passed balance and non-destructive checks.`);
  }
}

if (hasError) {
  console.error('\nSQL validation completed with errors.');
  process.exit(1);
} else {
  console.log('\nAll SQL migrations passed syntax and safety validation!');
}
