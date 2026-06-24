import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("D:\\DnD\\final_seed_v3.sql", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "Potion of Invisibility" in line:
        print(f"Match found at line {i}:")
        for j in range(max(1, i-2), min(len(lines), i+3)):
            print(f"  {j}: {lines[j-1].strip()}")
