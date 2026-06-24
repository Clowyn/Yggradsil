import os

queue_file = r'd:\DnD\scripts\queue.txt'
if not os.path.exists(queue_file):
    print("DONE")
else:
    with open(queue_file, 'r') as f:
        lines = f.readlines()
    if not lines:
        print("DONE")
    else:
        first = lines[0].strip()
        with open(queue_file, 'w') as f:
            f.writelines(lines[1:])
        print(first)
