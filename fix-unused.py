#!/usr/bin/env python3
import re
import subprocess

# Get all TS6133 errors
result = subprocess.run(['npx', 'tsc', '--noEmit'], capture_output=True, text=True)
output = result.stderr + result.stdout

# Parse unused variable/import errors
unused_pattern = r"src/([\w/\-\.]+\.tsx?)\((\d+),(\d+)\): error TS6133: '(\w+)' is declared but its value is never read\."
matches = re.findall(unused_pattern, output)

# Group by file
files_to_fix = {}
for file_path, line, col, var_name in matches:
    full_path = f"src/{file_path}"
    if full_path not in files_to_fix:
        files_to_fix[full_path] = []
    files_to_fix[full_path].append((int(line), int(col), var_name))

print(f"Found {len(matches)} unused variables in {len(files_to_fix)} files")
print("\nFiles with unused variables:")
for file_path, vars_list in sorted(files_to_fix.items()):
    print(f"  {file_path}: {', '.join(v[2] for v in vars_list)}")
