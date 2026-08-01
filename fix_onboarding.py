import re

with open('components/OnboardingModal.tsx', 'r') as f:
    content = f.read()

# The error says "JSX elements cannot have multiple attributes with the same name"
# Likely borderRadius="md" and borderRadius="3xl" are both present, or fontWeight="medium" and another fontWeight.
content = re.sub(r'borderRadius="[^"]+"\s+borderRadius="3xl"', 'borderRadius="3xl"', content)
content = re.sub(r'borderRadius=\{[^}]+\}\s+borderRadius="3xl"', 'borderRadius="3xl"', content)

# Check for font weights
content = re.sub(r'fontWeight="[^"]+"\s+fontWeight="[^"]+"', 'fontWeight="bold"', content)

with open('components/OnboardingModal.tsx', 'w') as f:
    f.write(content)

print("Fixed OnboardingModal")
