with open("D:\\DnD\\src\\components\\gm\\GMDashboard.tsx", "r", encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "InventoryTab" in line or "StatTreeTab" in line:
        print(f"{i}: {line.strip()}")
