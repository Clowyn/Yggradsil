with open("D:\\DnD\\final_seed_v3_part1.sql", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "Potion of Invisibility" in line or "Scroll of Fireball" in line:
        print(f"{i}: {line.strip()[:150]}")
