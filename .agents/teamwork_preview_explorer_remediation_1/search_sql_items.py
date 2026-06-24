import os

for file in os.listdir("D:\\DnD"):
    if file.endswith(".sql"):
        with open(os.path.join("D:\\DnD", file), "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            if "Potion of Invisibility" in content:
                print(f"Found Potion of Invisibility in {file}")
