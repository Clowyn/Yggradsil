with open("D:\\DnD\\src\\components\\gm\\GMDashboard.tsx", "r", encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines, 1):
    if "addItem(" in line or "removeItem(" in line or "addSkill(" in line or "removeSkill(" in line:
        print(f"{i}: {line.strip()}")
