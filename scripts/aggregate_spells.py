#!/usr/bin/env python3
"""
Aggregation script: Reads all spell JSON files from d:\\DnD\\scripts\\spells\\
and produces a clean SQL seed file for Supabase injection.

Usage:
    python d:\\DnD\\scripts\\aggregate_spells.py

Output:
    d:\\DnD\\final_seed_v3.sql  (complete SQL with DELETE + INSERT)
"""

import json
import os
import sys
import uuid
import math

SPELLS_DIR = r"d:\DnD\scripts\spells"
OUTPUT_FILE = r"d:\DnD\final_seed_v3.sql"

# Map of subclass_key -> class category key (from constants.ts)
SUBCLASS_TO_CLASS = {
    # Mage (10)
    'druid': 'mage', 'dark_mage': 'mage', 'elementalist_mage': 'mage',
    'psychomage': 'mage', 'blood_mage': 'mage', 'mana_mage': 'mage',
    'priest': 'mage', 'warlock': 'mage', 'shaman': 'mage', 'oracle_mage': 'mage',
    # Warrior (12)
    'executioner': 'warrior', 'drunken_master': 'warrior', 'berserker': 'warrior',
    'monk': 'warrior', 'iron_fist': 'warrior', 'sword_sentinel': 'warrior',
    'samurai': 'warrior', 'aura_fighter': 'warrior', 'elemental_swordmaster': 'warrior',
    'weapon_saint': 'warrior', 'last_samurai': 'warrior', 'executioner_adv': 'warrior',
    # Tank (10)
    'vanguard_guardian': 'tank', 'wall_guard': 'tank', 'coreplate': 'tank',
    'sworn_shield': 'tank', 'guardian_of_faith': 'tank', 'stoneheart': 'tank',
    'twin_ramparts': 'tank', 'life_guardian': 'tank', 'wrestler': 'tank',
    'triple_ramparts': 'tank',
    # Neutral (7)
    'commander': 'neutral', 'gambler': 'neutral', 'merchant': 'neutral',
    'curious': 'neutral', 'beast_tamer': 'neutral', 'imposter': 'neutral',
    'genius': 'neutral',
    # Assassin (8)
    'darkcabe': 'assassin', 'venomblood': 'assassin', 'phantom_veil': 'assassin',
    'nightmare_stalker': 'assassin', 'echoblade': 'assassin', 'ninja': 'assassin',
    'mindhunter': 'assassin', 'spy': 'assassin',
    # Marksman (8)
    'stormshot': 'marksman', 'sniper': 'marksman', 'index': 'marksman',
    'one_shot': 'marksman', 'gunslinger': 'marksman', 'rune_archer': 'marksman',
    'late_chaser': 'marksman', 'elementalist_archer': 'marksman',
    # Crafting (4)
    'rune_master': 'crafting', 'blacksmith': 'crafting', 'alchemist': 'crafting',
    'cook': 'crafting',
    # Summoner (4)
    'necromancer': 'summoner', 'hellbinder': 'summoner', 'oracle_summoner': 'summoner',
    'soul_summoner': 'summoner',
}

def escape_sql(s):
    """Escape single quotes for SQL string literals."""
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("'", "''") + "'"

def compute_position(spell_index, branch_name, branches, total_in_branch, pos_in_branch):
    """
    Compute x,y position for a spell node in a radial tree layout.
    Each branch fans out from center at an angle.
    """
    branch_idx = branches.index(branch_name) if branch_name in branches else 0
    num_branches = max(len(branches), 1)

    # Spread branches in a fan from -120 to +120 degrees (top-down tree)
    angle_spread = 240  # degrees
    start_angle = -angle_spread / 2
    branch_angle_deg = start_angle + (branch_idx / max(num_branches - 1, 1)) * angle_spread
    branch_angle = math.radians(branch_angle_deg + 90)  # +90 so 0 is downward

    # Each spell in a branch goes further from center
    radius = 200 + pos_in_branch * 250

    x = int(math.cos(branch_angle) * radius)
    y = int(math.sin(branch_angle) * radius)

    return x, y


def process_subclass(subclass_data):
    """Process one subclass entry from JSON and return SQL statements."""
    subclass_key = subclass_data['subclass_key']
    class_key = SUBCLASS_TO_CLASS.get(subclass_key)
    if not class_key:
        print(f"  WARNING: Unknown subclass_key '{subclass_key}', skipping.")
        return [], [], []

    tree_id = str(uuid.uuid4())
    tree_name_en = subclass_data.get('tree_name_en', f'{subclass_key} Tree')
    tree_name_tr = subclass_data.get('tree_name_tr', f'{subclass_key} Ağacı')
    tree_desc_en = subclass_data.get('tree_desc_en', '')
    tree_desc_tr = subclass_data.get('tree_desc_tr', '')

    # SQL for spell_trees INSERT
    tree_sql = (
        f"INSERT INTO spell_trees (id, name_tr, name_en, description_tr, description_en) VALUES "
        f"({escape_sql(tree_id)}, {escape_sql(tree_name_tr)}, {escape_sql(tree_name_en)}, "
        f"{escape_sql(tree_desc_tr)}, {escape_sql(tree_desc_en)});"
    )

    # SQL for spell_tree_assignments INSERT
    assign_id = str(uuid.uuid4())
    assign_sql = (
        f"INSERT INTO spell_tree_assignments (id, spell_tree_id, class_key, subclass_key, min_level) VALUES "
        f"({escape_sql(assign_id)}, {escape_sql(tree_id)}, {escape_sql(class_key)}, "
        f"{escape_sql(subclass_key)}, 1);"
    )

    # Get branches list
    branches = subclass_data.get('branches', ['Base'])
    # Add Cross-Branch if not present
    all_branches = list(branches)
    if 'Cross-Branch' not in all_branches:
        all_branches.append('Cross-Branch')

    # Count spells per branch for positioning
    spells = subclass_data.get('spells', [])
    branch_counters = {}

    spell_sqls = []
    for i, spell in enumerate(spells):
        spell_id = str(uuid.uuid4())
        spell_key = spell['spell_key']
        branch = spell.get('branch', 'Base')

        # Track position within branch
        if branch not in branch_counters:
            branch_counters[branch] = 0
        pos_in_branch = branch_counters[branch]
        branch_counters[branch] += 1

        # Count total spells in this branch for spacing
        total_in_branch = sum(1 for s in spells if s.get('branch', 'Base') == branch)

        x, y = compute_position(i, branch, all_branches, total_in_branch, pos_in_branch)

        prerequisites = spell.get('prerequisites', [])
        effects = spell.get('effects', {})

        sql = (
            f"INSERT INTO spells (id, spell_tree_id, spell_key, name_tr, name_en, "
            f"description_tr, description_en, branch, min_level, xp_cost, tier, "
            f"prerequisites, position, effects, icon) VALUES ("
            f"{escape_sql(spell_id)}, {escape_sql(tree_id)}, {escape_sql(spell_key)}, "
            f"{escape_sql(spell.get('name_tr', ''))}, {escape_sql(spell.get('name_en', ''))}, "
            f"{escape_sql(spell.get('description_tr', ''))}, {escape_sql(spell.get('description_en', ''))}, "
            f"{escape_sql(branch)}, {spell.get('min_level', 1)}, {spell.get('xp_cost', 100)}, "
            f"{spell.get('tier', 1)}, "
            f"'{json.dumps(prerequisites).replace('[', '{').replace(']', '}')}', "
            f"'{{\"x\": {x}, \"y\": {y}}}', "
            f"'{json.dumps(effects, ensure_ascii=False).replace(chr(39), chr(39)+chr(39))}', "
            f"{escape_sql(spell.get('icon', '✨'))});"
        )
        spell_sqls.append(sql)

    return [tree_sql], [assign_sql], spell_sqls


def main():
    print("=" * 60)
    print("Spell Aggregation Script")
    print("=" * 60)

    all_tree_sqls = []
    all_assign_sqls = []
    all_spell_sqls = []
    total_subclasses = 0
    total_spells = 0

    # Read all JSON files from the spells directory
    json_files = sorted([f for f in os.listdir(SPELLS_DIR) if f.endswith('.json') and f != 'TEMPLATE_REFERENCE.json'])

    if not json_files:
        print(f"ERROR: No JSON files found in {SPELLS_DIR}")
        sys.exit(1)

    print(f"\nFound {len(json_files)} JSON file(s):")

    for filename in json_files:
        filepath = os.path.join(SPELLS_DIR, filename)
        print(f"\n  Processing: {filename}")

        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except Exception as e:
            print(f"    ERROR reading {filename}: {e}")
            continue

        # Handle both single-object and array formats
        if isinstance(data, dict):
            data = [data]

        for subclass_data in data:
            subclass_key = subclass_data.get('subclass_key', 'unknown')
            num_spells = len(subclass_data.get('spells', []))
            print(f"    Subclass: {subclass_key} ({num_spells} spells)")

            tree_sqls, assign_sqls, spell_sqls = process_subclass(subclass_data)
            all_tree_sqls.extend(tree_sqls)
            all_assign_sqls.extend(assign_sqls)
            all_spell_sqls.extend(spell_sqls)
            total_subclasses += 1
            total_spells += num_spells

    print(f"\n{'=' * 60}")
    print(f"Summary: {total_subclasses} subclasses, {total_spells} spells")
    print(f"{'=' * 60}")

    # Validate
    expected_subclasses = len(SUBCLASS_TO_CLASS)
    if total_subclasses < expected_subclasses:
        missing = set(SUBCLASS_TO_CLASS.keys())
        for f in json_files:
            filepath = os.path.join(SPELLS_DIR, f)
            try:
                with open(filepath, 'r', encoding='utf-8') as fh:
                    data = json.load(fh)
                if isinstance(data, dict):
                    data = [data]
                for d in data:
                    missing.discard(d.get('subclass_key'))
            except:
                pass
        if missing:
            print(f"\nWARNING: Missing subclasses ({len(missing)}):")
            for m in sorted(missing):
                print(f"  - {m}")

    # Write output SQL
    print(f"\nWriting SQL to: {OUTPUT_FILE}")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("-- ==============================================\n")
        f.write("-- Spell Tree V3: Full Quality Seed Data\n")
        f.write(f"-- Generated: {total_subclasses} subclasses, {total_spells} spells\n")
        f.write("-- ==============================================\n\n")

        f.write("-- STEP 1: Clear existing spell data\n")
        f.write("DELETE FROM character_spells;\n")
        f.write("DELETE FROM spells;\n")
        f.write("DELETE FROM spell_tree_assignments;\n")
        f.write("DELETE FROM spell_trees;\n\n")

        f.write(f"-- STEP 2: Insert {total_subclasses} spell trees\n")
        for sql in all_tree_sqls:
            f.write(sql + "\n")

        f.write(f"\n-- STEP 3: Insert {total_subclasses} spell tree assignments\n")
        for sql in all_assign_sqls:
            f.write(sql + "\n")

        f.write(f"\n-- STEP 4: Insert {total_spells} spells\n")
        for sql in all_spell_sqls:
            f.write(sql + "\n")

        f.write("\n-- Done!\n")

    # Calculate file size
    file_size = os.path.getsize(OUTPUT_FILE)
    print(f"Output file size: {file_size / 1024:.1f} KB")
    print(f"\nDone! Run this SQL in your Supabase SQL Editor.")


if __name__ == '__main__':
    main()
