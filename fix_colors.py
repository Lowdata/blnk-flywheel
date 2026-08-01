import re

with open('components/OnboardingModal.tsx', 'r') as f:
    content = f.read()

content = content.replace('color="gray.400" fontSize="xs" color="gray.400"', 'color="gray.400" fontSize="xs"')
content = content.replace('color="white"\n                    color="gray.400"', 'color="white"')
content = content.replace('color="pink.200"\n                      color="gray.400"', 'color="pink.200"')

with open('components/OnboardingModal.tsx', 'w') as f:
    f.write(content)

print("Fixed OnboardingModal colors")
