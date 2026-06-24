# Handoff Report — XP Distribution Verification

## 1. Observation

During code inspection and empirical test execution, we observed the following:

- **XP Distribution Logic (GM Dashboard)**:
  In `src/components/gm/GMDashboard.tsx` lines 344–368, the individual and bulk XP award handler `giveXP` computes:
  ```typescript
  const newXp = Math.max(0, player.xp + amount);
  const newLevel = Math.floor(newXp / 1000) + 1;
  ```
  It then updates the character row in Supabase:
  ```typescript
  const { error } = await supabase
    .from('characters')
    .update({
      xp_total: newXp,
      xp_available: newXp, // Update pool for tree unlocks
      level: newLevel,
      updated_at: new Date().toISOString()
    })
    .eq('id', playerId);
  ```

- **Spell Unlock Logic (Database Function)**:
  In `spell_schema.sql` lines 143–164, the atomic transaction function `unlock_spell` correctly deducts the XP cost from `xp_available` when a player unlocks a spell:
  ```sql
  -- 2. Deduct XP from character
  UPDATE characters 
  SET xp_available = xp_available - xp_val_cost 
  WHERE id = char_id;
  ```

- **Empirical Test Execution**:
  We ran the verification test script `node scripts/verify-xp-distribution.js` and observed:
  ```
  Character created. id=4f80c86e-30c7-4fe7-86b9-be9ae3c4b00d, xp_total=1500, xp_available=1500, level=2
  Unlocking spell of cost 50...
  After spell unlock: xp_total=1500, xp_available=1450, level=2

  Simulating GM XP distribution: -1 XP
  Updating character with: xp_total=1499, xp_available=1499, level=2

  Final state in Supabase:
  xp_total: 1499
  xp_available: 1499
  level: 2

  Verification Evaluation:
  1. xp_total: 1499 (Expected: 1499) -> PASS
  2. xp_available: 1499 (Expected: 1449) -> FAIL (XP REFUND EXPLOIT DETECTED)
  3. level: 2 (Expected: 2) -> PASS
  ```

---

## 2. Logic Chain

- **Step 1**: The client-side GM Dashboard only tracks the character's total XP (`char.xp_total`) in its `players` state under the `xp` field. It does not load or map `xp_available` (the unspent XP pool).
- **Step 2**: When the GM awards or deducts XP, the dashboard calculates the new total XP as `newXp = player.xp + amount`.
- **Step 3**: The dashboard sends the update to Supabase, setting both `xp_total` and `xp_available` to this `newXp` value.
- **Step 4**: Since `newXp` represents the new total XP, setting `xp_available` to `newXp` completely overwrites any previous decrements (spent XP) made to `xp_available` when the player unlocked spells.
- **Step 5**: Consequently, when the GM awards or deducts any XP, all previously spent XP is completely refunded, allowing characters to re-spend it to unlock more spells. In the case of a deduction, the available XP can even increase, creating a massive exploit.

---

## 3. Caveats

- The test was executed on the live Supabase database with sandbox characters and cleaned up successfully.
- We did not modify any implementation code in accordance with the review-only constraint.
- This verification assumes the intended behavior is for `xp_available` to represent the unspent XP pool (total XP minus spent XP).

---

## 4. Conclusion

- **XP Total**: Updated correctly in both bulk and individual distributions.
- **Level Recalculation**: Recalculates levels correctly using the custom linear formula (`Math.floor(xp / 1000) + 1`). However, it only does so on the GM Dashboard frontend, meaning any backend updates to XP will not trigger level updates unless replicated.
- **XP Available**: **Incorrectly updated**. Overwriting `xp_available` with the new total XP leads to a critical spent-XP refund bug.

### Challenge Summary

**Overall risk assessment**: CRITICAL

### Challenges

#### [Critical] Spent XP Refund Exploit
- **Assumption challenged**: That setting `xp_available: newXp` in the GM Dashboard is a safe way to distribute XP.
- **Attack scenario**: A player spends 1,000 XP to unlock spells, bringing their `xp_available` down. The GM then awards 1 XP. The dashboard overwrites `xp_available` with the new total, instantly refunding the 1,000 XP spent.
- **Blast radius**: Allows players to bypass spell-tree level restrictions and unlock all spells with a single XP award from the GM.
- **Mitigation**:
  1. Add `xp_available` to the `DemoPlayer` model and `mapCharacterToDemoPlayer`.
  2. Compute `newXpAvailable = Math.max(0, Math.min(newXp, (player.xp_available ?? 0) + amount))`.
  3. Update Supabase with the calculated `xp_available: newXpAvailable`.
  4. (Alternative) Implement a PostgreSQL function `distribute_xp(char_id uuid, amount int)` and call it via `.rpc('distribute_xp', ...)` to handle the update safely in a database transaction.

#### [Medium] Custom Linear Level Progression
- **Assumption challenged**: That the D&D companion app uses standard D&D rules.
- **Attack scenario**: Hardcoded linear division (`Math.floor(xp / 1000) + 1`) deviates from standard D&D 5e XP levels (Level 2: 300, Level 3: 900, Level 4: 2700, etc.). Players playing standard rules will level up at incorrect thresholds.
- **Blast radius**: Misaligned leveling expectations for standard campaigns.
- **Mitigation**: Implement a level-threshold lookup array in `src/lib/constants.ts` and use it to determine the level.

#### [Low] Integer Overflow in Postgres
- **Assumption challenged**: That GMs will only input reasonable XP values.
- **Attack scenario**: Entering a value like `9999999999` in the XP input triggers a 32-bit signed integer overflow in Postgres.
- **Blast radius**: Database transaction crash with error `22003: integer out of range`.
- **Mitigation**: Implement validation on the input fields in the GM Dashboard to cap maximum XP.

---

## 5. Verification Method

To verify these findings:
1. Run the test script using the command:
   ```bash
   node scripts/verify-xp-distribution.js
   ```
2. Verify that the output reports the critical exploit:
   `[CRITICAL BUG] Exploit Confirmed: The player's available XP was inflated...`
