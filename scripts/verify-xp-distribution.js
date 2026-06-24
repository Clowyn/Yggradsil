import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Read environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value.trim();
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runVerification() {
  console.log('--- Starting Empirical XP Distribution Verification ---');

  // Sign up a temporary user to be authenticated and bypass profile policies
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const email = `test_xp_${randomSuffix}@example.com`;
  const password = `TestPassword123!`;
  const username = `test_user_${randomSuffix}`;

  console.log(`Signing up temporary test user: ${email}...`);
  const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
  if (signUpErr) {
    console.error('Sign up failed:', signUpErr);
    process.exit(1);
  }
  const user = signUpData.user;
  if (!user) {
    console.error('No user returned from signup');
    process.exit(1);
  }
  console.log(`Successfully authenticated as user: ${user.id}`);

  try {
    // Insert profile
    console.log('Inserting profile...');
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: user.id,
      username: username,
      role: 'gm',
      locale: 'en'
    });
    if (profileErr) throw profileErr;

    // Create campaign
    console.log('Creating campaign...');
    const { data: campaign, error: campaignErr } = await supabase.from('campaigns').insert({
      name: `Test Campaign ${randomSuffix}`,
      gm_id: user.id
    }).select().single();
    if (campaignErr) throw campaignErr;
    console.log(`Created campaign ID: ${campaign.id}`);

    // Join campaign as member
    console.log('Creating campaign member...');
    const { error: memberErr } = await supabase.from('campaign_members').insert({
      campaign_id: campaign.id,
      profile_id: user.id,
      role: 'gm'
    });
    if (memberErr) throw memberErr;

    // Fetch a spell to use
    console.log('Fetching a seed spell...');
    const { data: spells, error: spellsErr } = await supabase.from('spells').select('id, xp_cost').limit(1);
    if (spellsErr || !spells || spells.length === 0) {
      console.warn('No spells found in database. Inserting a mock spell...');
      // Insert a mock spell tree first
      const { data: tree, error: treeErr } = await supabase.from('spell_trees').insert({
        name_tr: 'Test Tree',
        name_en: 'Test Tree'
      }).select().single();
      if (treeErr) throw treeErr;

      const { data: mockSpell, error: spellInsertErr } = await supabase.from('spells').insert({
        spell_tree_id: tree.id,
        spell_key: 'test_mock_spell',
        name_tr: 'Mock Spell',
        name_en: 'Mock Spell',
        xp_cost: 1000,
        level: 1,
        position: { x: 0, y: 0 }
      }).select().single();
      if (spellInsertErr) throw spellInsertErr;
      spells.push(mockSpell);
    }
    const spell = spells[0];
    console.log(`Using spell: ${spell.id} with cost ${spell.xp_cost}`);

    // 2. Create character
    console.log('Inserting character...');
    const { data: char, error: charErr } = await supabase.from('characters').insert({
      profile_id: user.id,
      campaign_id: campaign.id,
      name: `Hero_${randomSuffix}`,
      level: 2,
      xp_total: 1500,
      xp_available: 1500,
    }).select().single();
    if (charErr) throw charErr;
    console.log(`Character created. id=${char.id}, xp_total=${char.xp_total}, xp_available=${char.xp_available}, level=${char.level}`);

    // 3. Unlock spell (deducting XP)
    console.log(`Unlocking spell of cost ${spell.xp_cost}...`);
    const { error: unlockErr } = await supabase.rpc('unlock_spell', {
      char_id: char.id,
      spell_val_id: spell.id,
      xp_val_cost: spell.xp_cost
    });
    if (unlockErr) throw unlockErr;

    // Fetch character after unlock
    const { data: charAfterUnlock, error: fetchErr1 } = await supabase.from('characters').select('*').eq('id', char.id).single();
    if (fetchErr1) throw fetchErr1;
    console.log(`After spell unlock: xp_total=${charAfterUnlock.xp_total}, xp_available=${charAfterUnlock.xp_available}, level=${charAfterUnlock.level}`);

    // 4. Simulate GM distributing negative XP (deducting 1 XP)
    const amountToDistribute = -1;
    console.log(`\nSimulating GM XP distribution: ${amountToDistribute} XP`);
    
    // GMDashboard.tsx giveXP logic:
    // const newXp = Math.max(0, player.xp + amount);
    // const newLevel = Math.floor(newXp / 1000) + 1;
    // update({ xp_total: newXp, xp_available: newXp, level: newLevel })
    const playerXp = charAfterUnlock.xp_total; // maps to xp_total
    const newXp = Math.max(0, playerXp + amountToDistribute);
    const newLevel = Math.floor(newXp / 1000) + 1;

    console.log(`Updating character with: xp_total=${newXp}, xp_available=${newXp}, level=${newLevel}`);
    const { error: updateErr } = await supabase.from('characters').update({
      xp_total: newXp,
      xp_available: newXp,
      level: newLevel,
      updated_at: new Date().toISOString()
    }).eq('id', char.id);
    if (updateErr) throw updateErr;

    // Fetch final character state
    const { data: charFinal, error: fetchErr2 } = await supabase.from('characters').select('*').eq('id', char.id).single();
    if (fetchErr2) throw fetchErr2;
    console.log(`\nFinal state in Supabase:`);
    console.log(`xp_total: ${charFinal.xp_total}`);
    console.log(`xp_available: ${charFinal.xp_available}`);
    console.log(`level: ${charFinal.level}`);

    // Check correctness
    const expectedXpTotal = charAfterUnlock.xp_total + amountToDistribute; // 1500 - 1 = 1499
    const expectedXpAvailable = charAfterUnlock.xp_available + amountToDistribute; // 500 - 1 = 499
    const expectedLevel = Math.floor(expectedXpTotal / 1000) + 1; // 1499/1000 + 1 = 2

    console.log(`\nVerification Evaluation:`);
    console.log(`1. xp_total: ${charFinal.xp_total} (Expected: ${expectedXpTotal}) -> ${charFinal.xp_total === expectedXpTotal ? 'PASS' : 'FAIL'}`);
    console.log(`2. xp_available: ${charFinal.xp_available} (Expected: ${expectedXpAvailable}) -> ${charFinal.xp_available === expectedXpAvailable ? 'PASS' : 'FAIL (XP REFUND EXPLOIT DETECTED)'}`);
    console.log(`3. level: ${charFinal.level} (Expected: ${expectedLevel}) -> ${charFinal.level === expectedLevel ? 'PASS' : 'FAIL'}`);

    if (charFinal.xp_available === newXp && newXp > expectedXpAvailable) {
      console.log(`\n[CRITICAL BUG] Exploit Confirmed: The player's available XP was inflated from 500 to 1499, completely refunding the ${spell.xp_cost} XP they spent on the spell!`);
    }

  } catch (e) {
    console.error('Error during test execution:', e);
  } finally {
    console.log('\nStarting cleanup...');
    // Delete character_spells
    const { error: delSpellsErr } = await supabase.from('character_spells').delete().eq('character_id', user.id); // Wait, characters might not match user.id
    // To clean up correctly, let's delete character first
    const { data: charsToDelete } = await supabase.from('characters').select('id').eq('profile_id', user.id);
    if (charsToDelete) {
      for (const c of charsToDelete) {
        await supabase.from('character_spells').delete().eq('character_id', c.id);
        await supabase.from('character_stats').delete().eq('character_id', c.id);
        await supabase.from('map_tokens').delete().eq('character_id', c.id);
        await supabase.from('characters').delete().eq('id', c.id);
      }
    }
    await supabase.from('campaign_members').delete().eq('profile_id', user.id);
    await supabase.from('campaigns').delete().eq('gm_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    console.log('Cleanup complete.');
  }
}

runVerification();
