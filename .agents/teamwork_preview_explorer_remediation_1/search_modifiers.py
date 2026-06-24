with open("D:\\DnD\\src\\components\\gm\\GMDashboard.tsx", "r", encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "const add" in line or "const remove" in line or "const toggle" in line or "const update" in line or "const delete" in line:
        print(f"{i}: {line.strip()}")
