with open("D:\\DnD\\schema.sql", "r", encoding='utf-8') as f:
    lines = f.readlines()

tables = []
current_table = None
for line in lines:
    if "CREATE TABLE" in line:
        current_table = line.strip()
        tables.append(current_table)
    elif current_table and ");" in line:
        current_table = None

print("Tables in schema.sql:")
for t in tables:
    print(t)
