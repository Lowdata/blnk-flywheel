import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "import { Box, Button, Flex, Heading, Text, VStack, HStack, SimpleGrid, useToast, Input } from '@chakra-ui/react';",
    "import { Box, Button, Flex, Heading, Text, VStack, HStack, SimpleGrid, useToast, Input, Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton } from '@chakra-ui/react';"
)

content = content.replace(
    "const [showOnboarding, setShowOnboarding] = useState(false);",
    "const [showOnboarding, setShowOnboarding] = useState(false);\n  const [activeModal, setActiveModal] = useState<'howToPlay' | 'tasks' | 'referrals' | null>(null);"
)

# Extract sections
how_to_play_regex = re.compile(r'(<Box w="full" maxW="4xl">\s*<SpotlightCard.*?<!-- Grand Prize Banner -->.*?</SpotlightCard>\s*</Box>)', re.DOTALL)
how_to_play_match = how_to_play_regex.search(content)
how_to_play_jsx = how_to_play_match.group(1) if how_to_play_match else ""
content = how_to_play_regex.sub('', content)

tasks_regex = re.compile(r'(<SpotlightCard\s*p=\{6\}\s*spotlightColor="rgba\(34, 197, 94, 0\.35\)".*?<Heading size="xs" fontFamily="var\(--font-pixel\)" color="green\.300">TASKS</Heading>.*?</SpotlightCard>)', re.DOTALL)
tasks_match = tasks_regex.search(content)
tasks_jsx = tasks_match.group(1) if tasks_match else ""
content = tasks_regex.sub('', content)

referrals_regex = re.compile(r'(<SpotlightCard\s*p=\{6\}\s*spotlightColor="rgba\(245, 158, 11, 0\.35\)".*?<Heading size="xs" fontFamily="var\(--font-pixel\)" color="yellow\.400">REFERRAL SYSTEM</Heading>.*?</SpotlightCard>)', re.DOTALL)
referrals_match = referrals_regex.search(content)
referrals_jsx = referrals_match.group(1) if referrals_match else ""
content = referrals_regex.sub('', content)

# Change spotlight colors in extracted JSX
how_to_play_jsx = how_to_play_jsx.replace('spotlightColor="rgba(34, 197, 94, 0.35)"', 'spotlightColor="rgba(236, 72, 153, 0.35)"', 1)
how_to_play_jsx = how_to_play_jsx.replace('spotlightColor="rgba(74, 222, 128, 0.4)"', 'spotlightColor="rgba(236, 72, 153, 0.35)"') 
how_to_play_jsx = how_to_play_jsx.replace('spotlightColor="rgba(245, 158, 11, 0.35)"', 'spotlightColor="rgba(6, 182, 212, 0.35)"') 
how_to_play_jsx = how_to_play_jsx.replace('spotlightColor="rgba(34, 197, 94, 0.4)"', 'spotlightColor="rgba(168, 85, 247, 0.35)"') 

tasks_jsx = tasks_jsx.replace('spotlightColor="rgba(34, 197, 94, 0.35)"', 'spotlightColor="rgba(6, 182, 212, 0.35)"')
referrals_jsx = referrals_jsx.replace('spotlightColor="rgba(245, 158, 11, 0.35)"', 'spotlightColor="rgba(168, 85, 247, 0.35)"')

# Since we removed the Task and Referral SpotlightCards, the SimpleGrid is now empty. We should remove the SimpleGrid.
empty_grid_regex = re.compile(r'<SimpleGrid columns=\{\{ base: 1, md: 2 \}\} gap=\{6\}>\s*</SimpleGrid>', re.DOTALL)
content = empty_grid_regex.sub('', content)

# Add Modals before the closing Box
modals = """
      <Modal isOpen={activeModal === 'howToPlay'} onClose={() => setActiveModal(null)} size="3xl" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none" my={0}>
          <ModalCloseButton color="white" zIndex={20} />
          <ModalBody p={0}>
            """ + how_to_play_jsx + """
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={activeModal === 'tasks'} onClose={() => setActiveModal(null)} size="2xl" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none" my={0}>
          <ModalCloseButton color="white" zIndex={20} />
          <ModalBody p={0}>
            """ + tasks_jsx + """
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal isOpen={activeModal === 'referrals'} onClose={() => setActiveModal(null)} size="2xl" isCentered>
        <ModalOverlay backdropFilter="blur(4px)" bg="blackAlpha.800" />
        <ModalContent bg="transparent" boxShadow="none" my={0}>
          <ModalCloseButton color="white" zIndex={20} />
          <ModalBody p={0}>
            """ + referrals_jsx + """
          </ModalBody>
        </ModalContent>
      </Modal>
"""

content = content.replace("      {/* Onboarding Modal Protocol (Wallet -> Twitter -> Invite Code) */}", modals + "\n      {/* Onboarding Modal Protocol (Wallet -> Twitter -> Invite Code) */}")

# Replace the scrolling properties
content = content.replace(
    '<Box minH="100vh" w="100%" bg="#060d08" color="white" position="relative" pb={20} style={{ touchAction: \'pan-y\', WebkitOverflowScrolling: \'touch\', overflowY: \'auto\', overscrollBehaviorY: \'auto\' }}>',
    '<Box h="100vh" w="100%" bg="#060d08" color="white" position="relative" overflow="hidden" display="flex" flexDirection="column">'
)

content = content.replace(
    '<VStack gap={10} align="center" maxW="container.xl" mx="auto" px={{ base: 4, md: 8 }} py={8} position="relative" zIndex={10}>',
    '<VStack gap={10} align="center" maxW="container.xl" mx="auto" px={{ base: 4, md: 8 }} py={8} position="relative" zIndex={10} flex={1} w="full" justify="center">'
)

# Insert the 3 buttons
buttons = """
        {/* Retro Navigation Icons */}
        <HStack gap={4} pt={4} justify="center" wrap="wrap">
          <Button
            size="md"
            className="pixel-button"
            fontFamily="var(--font-pixel)"
            fontSize="xs"
            onClick={() => setActiveModal('howToPlay')}
            bg="#0f2416" border="2px solid #166534" rounded="none"
            _hover={{ borderColor: '#22c55e', transform: 'translateY(-2px)' }}
          >
            ❓ HOW TO PLAY
          </Button>
          <Button
            size="md"
            className="pixel-button"
            fontFamily="var(--font-pixel)"
            fontSize="xs"
            onClick={() => setActiveModal('tasks')}
            bg="#0f2416" border="2px solid #166534" rounded="none"
            _hover={{ borderColor: '#22c55e', transform: 'translateY(-2px)' }}
          >
            ⚔️ TASKS
          </Button>
          <Button
            size="md"
            className="pixel-button"
            fontFamily="var(--font-pixel)"
            fontSize="xs"
            onClick={() => setActiveModal('referrals')}
            bg="#0f2416" border="2px solid #166534" rounded="none"
            _hover={{ borderColor: '#22c55e', transform: 'translateY(-2px)' }}
          >
            📜 REFERRALS
          </Button>
        </HStack>
"""

content = content.replace(
    "          </Text>\n        </VStack>",
    "          </Text>\n        </VStack>\n" + buttons
)

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("success")
