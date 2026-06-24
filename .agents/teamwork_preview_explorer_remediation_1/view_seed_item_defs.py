import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("D:\\DnD\\final_seed_v3.sql", "r", encoding="utf-8", errors="ignore") as f:
    for i, line in enumerate(f, 1):
        if "INSERT INTO item_definitions" in line:
            print(f"{i}: {line.strip()[:150]}")
