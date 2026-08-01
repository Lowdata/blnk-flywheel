with open('app/game/page.tsx', 'r') as f:
    content = f.read()

content = content.replace('fontFamily: \'var(--font-pixel)\'', 'fontWeight: "bold", fontFamily: "var(--font-inter), sans-serif"')
content = content.replace('fontFamily: \'var(--font-retro)\'', 'fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif"')
content = content.replace('fontFamily: \'monospace\'', 'fontWeight: "medium", fontFamily: "var(--font-inter), sans-serif"')
content = content.replace('fontFamily="var(--font-pixel)"', 'fontWeight="bold" fontFamily="var(--font-inter), sans-serif"')
content = content.replace('fontFamily="var(--font-retro)"', 'fontWeight="medium" fontFamily="var(--font-inter), sans-serif"')

# Also replace the social posts text in shareOnX and shareLossOnX
# shareOnX has 'just pulled GUARANTEED...'
content = content.replace(
    'just pulled GUARANTEED on @blnk_xyz 🎰 colour unlocked. grey world is done. free to play: blnk.xyz',
    'one crack. and the grey doesn\'t hold anymore. colour doesn\'t ease in, it floods.'
)
content = content.replace(
    'pulled FCFS on @blnk_xyz — racing the clock ⏳ colourful capsules. grey world. get in. free to play: blnk.xyz',
    'not every pull hits. but the one that does breaks the grey wide open. pull, and find out.'
)
# shareLossOnX has 'just tried my luck...'
content = content.replace(
    'just tried my luck on the @blnk_xyz claw machine 🎰 colour unlocked. grey world is done. free to play: blnk.xyz',
    'not every pull hits. most don\'t. but the one that does breaks the grey wide open. pull, and find out.'
)

with open('app/game/page.tsx', 'w') as f:
    f.write(content)

print("Updated app/game/page.tsx")
