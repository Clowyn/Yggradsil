with open("D:\\DnD\\schema.sql", "r", encoding='utf-8') as f:
    content = f.read()

# find CREATE TABLE character_skills ... to the next closing block
import re
pattern_skills = re.compile(r'CREATE TABLE character_skills.*?\);', re.DOTALL | re.IGNORECASE)
pattern_inventory = re.compile(r'CREATE TABLE inventory_items.*?\);', re.DOTALL | re.IGNORECASE)

print("--- character_skills ---")
for match in pattern_skills.finditer(content):
    print(match.group(0))

print("\n--- inventory_items ---")
for match in pattern_inventory.finditer(content):
    print(match.group(0))
