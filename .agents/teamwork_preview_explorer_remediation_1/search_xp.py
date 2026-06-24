import os
import re

workspace = "D:\\DnD"
patterns = [re.compile(r'xp_available|xp_total', re.IGNORECASE)]

results = []
for root, dirs, files in os.walk(workspace):
    if ".agents" in root or "node_modules" in root or ".git" in root or ".gemini" in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.sql', '.js')):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    for i, line in enumerate(f, 1):
                        for pattern in patterns:
                            if pattern.search(line):
                                results.append(f"{path}:{i}: {line.strip()}")
            except Exception as e:
                pass

with open("D:\\DnD\\.agents\\teamwork_preview_explorer_remediation_1\\search_results.txt", "w", encoding='utf-8') as out:
    for r in results:
        out.write(r + "\n")

print(f"Done, found {len(results)} matches.")
