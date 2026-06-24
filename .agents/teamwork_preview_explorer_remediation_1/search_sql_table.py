import os

for file in os.listdir("D:\\DnD"):
    if file.endswith(".sql"):
        path = os.path.join("D:\\DnD", file)
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            for i, line in enumerate(f, 1):
                if "item_definitions" in line:
                    print(f"{file}:{i}: {line.strip()[:120]}")
