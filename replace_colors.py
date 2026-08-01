with open('app/page.tsx', 'r') as f:
    content = f.read()

# Base backgrounds
content = content.replace('bg="#060d08"', 'bgGradient="linear(to-br, #11051c, #06020a, #1a082b)"')

# Scanlines
content = content.replace('rgba(34, 197, 94, 0.25)', 'rgba(236, 72, 153, 0.20)') # Pink scanlines

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

# Hero title gradient
content = content.replace(
    'color="pink.300"\n            textShadow="3px 3px 0px #14532d"',
    'bgGradient="linear(to-r, pink.400, purple.500)"\n            bgClip="text"\n            filter="drop-shadow(3px 3px 0px #4a044e)"'
)
content = content.replace(
    'color="green.300"\n            textShadow="3px 3px 0px #14532d"',
    'bgGradient="linear(to-r, pink.400, purple.500)"\n            bgClip="text"\n            filter="drop-shadow(3px 3px 0px #4a044e)"'
)
content = content.replace('textShadow="2px 2px 0px #052e16"', 'textShadow="2px 2px 0px #2e0524"')

# Hex colors for borders, backgrounds, hovers
replacements = {
    '#166534': '#701a75', # green 800 -> fuchsia 900
    '#14532d': '#4a044e', # green 900 -> fuchsia 950
    '#052e16': '#2e0524', # green 950 -> pink 950
    '#0f2416': '#1f1029', # card bg -> dark purple
    '#0b1810': '#13091c', # card bg dark -> darker purple
    '#05130a': '#0e0514', # card bg darkest -> darkest purple
    '#050a06': '#08030d', # modal/card deep bg -> deep violet
    '#22c55e': '#d946ef', # green 500 -> fuchsia 500
    '#4ade80': '#f472b6', # green 400 -> pink 400
    '#d97706': '#9333ea', # yellow 600 -> purple 600
    '#eab308': '#a855f7', # yellow 500 -> purple 500
    '#713f12': '#581c87', # yellow 900 -> purple 900
    '#15803d': '#86198f', # green 700 -> fuchsia 800
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Some remaining green/yellow color strings from toast, etc.
# But they are standard chakra colors, might be fine as is, but let's change if found
content = content.replace('borderColor="yellow.500"', 'borderColor="purple.500"')

with open('app/page.tsx', 'w') as f:
    f.write(content)
