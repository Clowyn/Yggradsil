with open("D:\\DnD\\final_seed_v3_part1.sql", "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

import re
matches = re.findall(r"INSERT INTO item_definitions.*?;", content, re.DOTALL | re.IGNORECASE)
for m in matches:
    if "Potion of Invisibility" in m or "Scroll of Fireball" in m or "Boots of Elvenkind" in m:
        print(m)
