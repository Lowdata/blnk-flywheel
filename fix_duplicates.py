import re

with open('app/game/page.tsx', 'r') as f:
    content = f.read()

content = content.replace('fontWeight: 500,', '')
content = content.replace('fontWeight: "500",', '')
content = content.replace('fontWeight: \'500\',', '')

with open('app/game/page.tsx', 'w') as f:
    f.write(content)

