with open('components/OnboardingModal.tsx', 'r') as f:
    content = f.read()

content = content.replace('fontFamily="var(--font-pixel)"', 'fontWeight="medium"')
content = content.replace('fontFamily="var(--font-retro)"', 'fontWeight="bold"')
content = content.replace('fontFamily="var(--font-mono)"', 'color="gray.400"') # Let default sans take over, just apply color
content = content.replace('borderRadius="none"', 'borderRadius="3xl"')

with open('components/OnboardingModal.tsx', 'w') as f:
    f.write(content)

print("Updated OnboardingModal.tsx fonts")
