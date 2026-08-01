import re

with open('app/game/page.tsx', 'r') as f:
    content = f.read()

# Remove all remaining numeric fontWeight properties
content = re.sub(r'fontWeight:\s*\d+,', '', content)
content = re.sub(r'fontWeight:\s*[\'"]\d+[\'"],', '', content)

with open('app/game/page.tsx', 'w') as f:
    f.write(content)

