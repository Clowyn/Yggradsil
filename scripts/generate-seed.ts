import { RACE_TIERS, RACES, CLASS_CATEGORIES, SUBCLASSES } from '../src/lib/constants.ts';
import * as fs from 'fs';

let sql = `-- ==========================================\n-- D&D Companion App - Supabase Seed Data\n-- Run this script in the Supabase SQL Editor\n-- ==========================================\n\n`;

sql += `-- RACE TIERS\n`;
for (const tier of RACE_TIERS) {
  sql += `INSERT INTO race_tiers (key, name_tr, name_en, sort_order) VALUES ('${tier.key}', '${tier.name_tr.replace(/'/g, "''")}', '${tier.name_en.replace(/'/g, "''")}', ${tier.sort_order}) ON CONFLICT (key) DO NOTHING;\n`;
}

sql += `\n-- CLASS CATEGORIES\n`;
for (const cat of CLASS_CATEGORIES) {
  sql += `INSERT INTO class_categories (key, name_tr, name_en, sort_order) VALUES ('${cat.key}', '${cat.name_tr.replace(/'/g, "''")}', '${cat.name_en.replace(/'/g, "''")}', ${cat.sort_order}) ON CONFLICT (key) DO NOTHING;\n`;
}

sql += `\n-- RACES\n`;
for (const race of RACES) {
  sql += `INSERT INTO race_definitions (tier_id, key, name, description_tr, description_en, stat_bonuses) 
VALUES (
  (SELECT id FROM race_tiers WHERE key = '${race.tier_key}'),
  '${race.key}',
  '${race.name.replace(/'/g, "''")}',
  '${race.description_tr.replace(/'/g, "''")}',
  '${race.description_en.replace(/'/g, "''")}',
  '${JSON.stringify(race.stat_bonuses)}'::jsonb
) ON CONFLICT (key) DO NOTHING;\n`;
}

sql += `\n-- SUBCLASSES\n`;
for (const sub of SUBCLASSES) {
  sql += `INSERT INTO subclass_definitions (category_id, key, name_tr, name_en, ability_name_tr, ability_name_en, ability_desc_tr, ability_desc_en, is_low_rate, is_advanced, base_stats)
VALUES (
  (SELECT id FROM class_categories WHERE key = '${sub.category_key}'),
  '${sub.key}',
  '${sub.name_tr.replace(/'/g, "''")}',
  '${sub.name_en.replace(/'/g, "''")}',
  '${sub.ability_name_tr.replace(/'/g, "''")}',
  '${sub.ability_name_en.replace(/'/g, "''")}',
  '${sub.ability_desc_tr.replace(/'/g, "''")}',
  '${sub.ability_desc_en.replace(/'/g, "''")}',
  ${sub.is_low_rate},
  ${sub.is_advanced},
  '${JSON.stringify(sub.base_stats)}'::jsonb
) ON CONFLICT (key) DO NOTHING;\n`;
}

fs.writeFileSync('seed.sql', sql);
console.log('seed.sql generated!');
