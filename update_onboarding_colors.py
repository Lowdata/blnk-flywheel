with open('components/OnboardingModal.tsx', 'r') as f:
    content = f.read()

# Typography colors
content = content.replace('color="green.400"', 'color="pink.400"')
content = content.replace('color="green.300"', 'color="pink.300"')
content = content.replace('color="green.200"', 'color="pink.200"')
content = content.replace('color="green.100"', 'color="pink.100"')
content = content.replace('color="green.50"', 'color="pink.50"')

content = content.replace('color="yellow.400"', 'color="purple.400"')
content = content.replace('color="yellow.300"', 'color="purple.300"')
content = content.replace('color="yellow.200"', 'color="purple.200"')
content = content.replace('color="yellow.500"', 'color="purple.500"')

# Hex colors for borders, backgrounds, hovers
replacements = {
    'rgba(34, 197, 94, 0.35)': 'rgba(236, 72, 153, 0.35)',
    'rgba(34, 197, 94, 0.15)': 'rgba(236, 72, 153, 0.15)',
    'rgba(74, 222, 128, 0.4)': 'rgba(244, 114, 182, 0.4)',
    'rgba(245, 158, 11, 0.4)': 'rgba(192, 132, 252, 0.4)',
    '#050e08': '#0e0514', # bg dark
    '#166534': '#701a75', # green 800 -> fuchsia 900
    '#14532d': '#4a044e', # green 900 -> fuchsia 950
    '#052e16': '#2e0524', # green 950 -> pink 950
    '#0f2416': '#1f1029', # card bg -> dark purple
    '#0b1810': '#13091c', # card bg dark -> darker purple
    '#05130a': '#0e0514', # card bg darkest -> darkest purple
    '#050a06': '#08030d', # modal deep bg -> deep violet
    '#0a2312': '#1c082a', # another green bg -> purple
    '#22c55e': '#d946ef', # green 500 -> fuchsia 500
    '#4ade80': '#f472b6', # green 400 -> pink 400
    '#d97706': '#9333ea', # yellow 600 -> purple 600
    '#eab308': '#a855f7', # yellow 500 -> purple 500
    '#713f12': '#581c87', # yellow 900 -> purple 900
    '#15803d': '#86198f', # green 700 -> fuchsia 800
    '#030805': '#060308',
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open('components/OnboardingModal.tsx', 'w') as f:
    f.write(content)
