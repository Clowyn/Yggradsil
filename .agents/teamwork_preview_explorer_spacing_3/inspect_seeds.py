import re
import json

def parse_sql_file_with_tree(file_path):
    spells = []
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    insert_pattern = re.compile(r"INSERT INTO spells\s*\([^)]*\)\s*VALUES\s*(.*?);", re.DOTALL | re.IGNORECASE)
    matches = insert_pattern.findall(content)
    
    for match in matches:
        rows = re.findall(r"\(([^)]+)\)", match)
        for row in rows:
            parts = []
            current = []
            in_quote = False
            in_array = False
            in_json = False
            
            i = 0
            while i < len(row):
                c = row[i]
                if c == "'" and (i == 0 or row[i-1] != '\\'):
                    in_quote = not in_quote
                    current.append(c)
                elif c == '[' and not in_quote:
                    in_array = True
                    current.append(c)
                elif c == ']' and not in_quote:
                    in_array = False
                    current.append(c)
                elif c == '{' and not in_quote:
                    in_json = True
                    current.append(c)
                elif c == '}' and not in_quote:
                    in_json = False
                    current.append(c)
                elif c == ',' and not in_quote and not in_array and not in_json:
                    parts.append("".join(current).strip())
                    current = []
                else:
                    current.append(c)
                i += 1
            if current:
                parts.append("".join(current).strip())
            
            if len(parts) >= 12:
                spell_tree_id = parts[1].strip("'")
                spell_key = parts[2].strip("'")
                name_en = parts[4].strip("'")
                branch = parts[7].strip("'")
                try:
                    tier = int(parts[10])
                except:
                    tier = 1
                
                prereq_part = parts[11].strip("'")
                prereqs = []
                if prereq_part.startswith('{') and prereq_part.endswith('}'):
                    content_inside = prereq_part[1:-1]
                    if content_inside:
                        prereqs = [x.strip('"').strip() for x in content_inside.split(',') if x.strip()]
                
                spells.append({
                    'spell_tree_id': spell_tree_id,
                    'spell_key': spell_key,
                    'name_en': name_en,
                    'branch': branch,
                    'tier': tier,
                    'prerequisites': prereqs
                })
    return spells

all_spells = []
for filename in ['final_seed_v3_part1.sql', 'final_seed_v3_part2.sql', 'final_seed_v3_part3.sql', 'final_seed_v3.sql', 'seed.sql', 'spell_schema.sql']:
    try:
        spells = parse_sql_file_with_tree(f"d:/DnD/{filename}")
        all_spells.extend(spells)
    except Exception as e:
        print(f"Error parsing {filename}: {e}")

unique_spells = {}
for s in all_spells:
    unique_spells[s['spell_key']] = s

# Group by spell_tree_id
trees = {}
for s in unique_spells.values():
    tree_id = s['spell_tree_id']
    if tree_id not in trees:
        trees[tree_id] = []
    trees[tree_id].append(s)

print(f"Total trees: {len(trees)}")

depth_map = {}
def get_depth(spell_key):
    if spell_key in depth_map:
        return depth_map[spell_key]
    s = unique_spells.get(spell_key)
    if not s:
        return 0
    max_d = 0
    for p in s['prerequisites']:
        parent = unique_spells.get(p)
        if parent and parent['tier'] == s['tier']:
            max_d = max(max_d, get_depth(p) + 1)
    depth_map[spell_key] = max_d
    return max_d

# Find cases where prerequisites are in the same tier
same_tier_prereqs = []
for key, spell in unique_spells.items():
    for p in spell['prerequisites']:
        if p in unique_spells:
            parent = unique_spells[p]
            if parent['tier'] == spell['tier']:
                same_tier_prereqs.append((spell['spell_key'], spell['tier'], p))

print(f"Total same-tier prerequisites: {len(same_tier_prereqs)}")

# Compute row densities
max_row_density = 0
density_distribution = {} # num_spells_in_row -> count
max_density_details = []

for tree_id, tree_spells in trees.items():
    rows = {} # (tier, depth) -> list of spells
    for s in tree_spells:
        d = get_depth(s['spell_key'])
        key = (s['tier'], d)
        if key not in rows:
            rows[key] = []
        rows[key].append(s)
    
    for key, row_spells in rows.items():
        density = len(row_spells)
        density_distribution[density] = density_distribution.get(density, 0) + 1
        if density > max_row_density:
            max_row_density = density
            max_density_details = [(tree_id, key, [s['spell_key'] for s in row_spells])]
        elif density == max_row_density:
            max_density_details.append((tree_id, key, [s['spell_key'] for s in row_spells]))

print(f"Max row density (spells in the same tier and depth in a tree): {max_row_density}")
print("Density distribution:")
for density in sorted(density_distribution.keys()):
    print(f"  {density} spells/row: {density_distribution[density]} occurrences")

print("\nExamples of high density rows:")
for tree_id, key, spells in max_density_details[:3]:
    print(f"  Tree: {tree_id}, Tier/Depth: {key}, Count: {len(spells)}")
    print(f"  Spells: {spells}")
