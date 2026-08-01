import re

with open('/Users/ayushpahuja/Downloads/ClawMachine_Template/game/blnk-flywheel/app/page.tsx', 'r') as f:
    content = f.read()

start_idx = content.find('  return (')
if start_idx == -1:
    print("Could not find return statement")
    exit(1)

# Remove MouseSpotlight import if present
content = content.replace("import MouseSpotlight from '@/components/MouseSpotlight';\n", "")

new_ui = """  return (
    <Box minH="100vh" bg="gray.900" color="white" position="relative" overflow="hidden" display="flex" flexDirection="column" fontFamily="var(--font-inter), sans-serif">
      
      {/* Background Ambient Glow */}
      <Box position="absolute" top="-20%" left="-10%" w="50vw" h="50vw" bg="purple.600" filter="blur(150px)" opacity={0.5} borderRadius="full" pointerEvents="none" />
      <Box position="absolute" bottom="-20%" right="-10%" w="50vw" h="50vw" bg="teal.400" filter="blur(150px)" opacity={0.4} borderRadius="full" pointerEvents="none" />

      <VStack gap={{ base: 4, md: 8 }} align="center" maxW="4xl" mx="auto" px={{ base: 4, md: 8 }} py={12} position="relative" zIndex={10} flex={1} w="full" justify="center">
        
        {/* Floating Logout Button (only if connected) */}
        {address && (
          <Box position="absolute" top={4} right={4}>
             <Button
                size="sm"
                variant="ghost"
                color="whiteAlpha.700"
                fontWeight="medium"
                _hover={{ color: 'white', bg: 'whiteAlpha.200' }}
                onClick={handleLogout}
              >
                Logout
              </Button>
          </Box>
        )}

        {/* Hero Section */}
        <VStack gap={2} textAlign="center" pt={4} mb={8}>
          <Heading 
            size="4xl" 
            letterSpacing="0.2em" 
            fontWeight="black" 
            textTransform="uppercase"
            bgGradient="linear(to-r, cyan.400, purple.500, pink.500)"
            bgClip="text"
            dropShadow="0 0 20px rgba(255,255,255,0.5)"
          >
            BLNK
          </Heading>
          <Text fontSize="xl" color="whiteAlpha.800" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
            black to ink.
          </Text>
        </VStack>

        {/* Main Dashboard Cards */}
        {!address ? (
          <Box pt={4}>
            <Button 
              size="xl" 
              h="80px"
              px={12}
              fontSize="2xl"
              fontWeight="bold"
              rounded="full"
              bgGradient="linear(to-r, cyan.400, purple.500)"
              color="white"
              _hover={{ bgGradient: 'linear(to-r, cyan.300, purple.400)', transform: 'scale(1.05)' }}
              transition="all 0.3s ease"
              boxShadow="0 0 30px rgba(159, 122, 234, 0.6)"
              onClick={connectWallet}
            >
              CONNECT TO ENTER
            </Button>
          </Box>
        ) : (
          <VStack gap={{ base: 4, md: 8 }} w="full" align="stretch" maxW="3xl">
            {/* Wallet & Coins Glass Card */}
            <Flex 
              justify="space-between" 
              align="center"
              bg="whiteAlpha.100" 
              backdropFilter="blur(20px)"
              border="1px solid"
              borderColor="whiteAlpha.300"
              p={{ base: 5, md: 8 }} 
              rounded="2xl"
              boxShadow="xl"
              wrap="wrap" 
              gap={4}
            >
              <VStack align="start" gap={1}>
                <Text color="cyan.300" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Wallet Linked</Text>
                <Text fontFamily="monospace" fontSize="xl" fontWeight="semibold">{address.slice(0, 6)}...{address.slice(-4)}</Text>
              </VStack>
              <VStack align={{ base: 'start', sm: 'end' }} gap={1}>
                <Text color="pink.400" fontSize="sm" fontWeight="bold" textTransform="uppercase" letterSpacing="widest">Your Coins</Text>
                <Heading size="2xl" color="white">{user?.coins || 0}</Heading>
              </VStack>
            </Flex>

            {/* Tasks & Referrals Grid */}
            <Flex gap={{ base: 6, md: 8 }} direction={{ base: 'column', md: 'row' }}>
              
              {/* Tasks Card */}
              <Box 
                flex={1}
                bgGradient="linear(to-br, whiteAlpha.200, whiteAlpha.50)" 
                backdropFilter="blur(20px)"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={{ base: 5, md: 8 }} 
                rounded="2xl"
                position="relative"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, right: 0, h: '4px',
                  bgGradient: 'linear(to-r, cyan.400, blue.500)'
                }}
              >
                <VStack align="start" gap={2} mb={6}>
                  <Heading size="lg" mb={2}>Tasks</Heading>
                  <Text color="whiteAlpha.800">Complete tasks to earn coins and play the claw machine.</Text>
                </VStack>
                
                <VStack align="stretch" gap={3}>
                  {tasks.map((task: any) => {
                    const isCompleted = user?.completedTasks?.some(
                      (ct: any) =>
                        (ct._id || ct).toString() === (task._id || '').toString() || ct.taskId === task.taskId
                    );
                    const isVerifying = verifyingTasks[task.taskId];
                    return (
                      <Flex key={task.taskId} justify="space-between" align="center" p={3} bg="blackAlpha.400" borderRadius="lg">
                        <Text fontSize="sm" color="whiteAlpha.900" fontWeight="medium">{task.description}</Text>
                        <Button
                          size="sm"
                          bg={isCompleted ? "whiteAlpha.200" : "cyan.400"}
                          color={isCompleted ? "whiteAlpha.500" : "black"}
                          fontWeight="bold"
                          rounded="md"
                          h={7}
                          fontSize="xs"
                          isLoading={!!isVerifying}
                          isDisabled={isCompleted}
                          onClick={() => handleTaskClick(task)}
                          _hover={!isCompleted ? { bg: "cyan.300" } : {}}
                        >
                          {isCompleted ? 'Done' : `+${task.rewardAmount}`}
                        </Button>
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>

              {/* Referrals Card */}
              <Box 
                flex={1}
                bgGradient="linear(to-br, whiteAlpha.200, whiteAlpha.50)" 
                backdropFilter="blur(20px)"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={{ base: 5, md: 8 }} 
                rounded="2xl"
                position="relative"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, right: 0, h: '4px',
                  bgGradient: 'linear(to-r, pink.400, purple.500)'
                }}
              >
                <VStack align="start" gap={2} mb={6}>
                  <Heading size="lg" mb={2}>Referrals</Heading>
                  <Text color="whiteAlpha.800">Invite friends to earn additional color drops.</Text>
                </VStack>

                <Box p={4} bg="blackAlpha.500" rounded="lg" border="1px solid" borderColor="whiteAlpha.200" textAlign="center" mt="auto">
                  <Text color="gray.400" fontSize="sm" mb={1} textTransform="uppercase">Your Invite Code</Text>
                  <Text fontWeight="black" fontSize="2xl" color="pink.400" letterSpacing="widest">{user?.referralCode || '------'}</Text>
                </Box>
              </Box>
            </Flex>

            {/* Play CTA */}
            <Box pt={6}>
              <Button 
                size="xl" 
                h="100px" 
                w="full"
                fontSize="3xl" 
                fontWeight="black"
                letterSpacing="widest"
                bg="white" 
                color="black" 
                rounded="2xl"
                _hover={{ transform: 'translateY(-4px)', boxShadow: '0 20px 40px rgba(255,255,255,0.2)' }}
                transition="all 0.3s ease"
                onClick={() => {
                  soundManager.playClick();
                  router.push('/game');
                }}
              >
                PLAY CLAW MACHINE
              </Button>
            </Box>
          </VStack>
        )}
      </VStack>

      {/* Floating Info Button */}
      <Box position="absolute" bottom={6} right={6} zIndex={20}>
        <Button
          size="sm"
          variant="outline"
          rounded="full"
          color="whiteAlpha.700"
          borderColor="whiteAlpha.300"
          _hover={{ color: "white", borderColor: "white", bg: "whiteAlpha.200" }}
          onClick={() => setActiveModal('about')}
        >
          ℹ INFO
        </Button>
      </Box>

      {/* About Modal */}
      <Modal isOpen={activeModal === 'about'} onClose={() => setActiveModal(null)} size="xl" isCentered scrollBehavior="inside">
        <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.800" />
        <ModalContent bg="gray.900" border="1px solid" borderColor="purple.500" borderRadius="2xl" p={4} maxH="80vh" boxShadow="0 0 30px rgba(159, 122, 234, 0.4)">
          <ModalCloseButton color="gray.400" />
          <ModalBody pb={6}>
            <VStack gap={8} align="start" pt={4}>
              <Heading size="md" color="white" fontWeight="bold" letterSpacing="widest" textTransform="uppercase" bgGradient="linear(to-r, cyan.400, purple.500)" bgClip="text">
                About — The Crypto Bro
              </Heading>
              
              <VStack align="start" gap={2}>
                <Text color="cyan.300" fontSize="xs" fontWeight="bold" textTransform="uppercase">Origin</Text>
                <Text color="whiteAlpha.800" fontSize="sm" lineHeight="tall">He remembers when the charts used to be interesting. Now it&apos;s just grey lines on a grey screen, in a room he hasn&apos;t left in a while. Rugged twice. Liquidated once, badly. The losses stopped feeling like losses and started feeling like weather. His world went flat around the same time his portfolio did.</Text>
              </VStack>

              <VStack align="start" gap={2}>
                <Text color="pink.400" fontSize="xs" fontWeight="bold" textTransform="uppercase">The Machine</Text>
                <Text color="whiteAlpha.800" fontSize="sm" lineHeight="tall">There&apos;s a machine he keeps coming back to. A claw, a pile of capsules, no promise except a pull. He pulls anyway. Most of the time, nothing. The grey holds.</Text>
              </VStack>

              <VStack align="start" gap={2}>
                <Text color="purple.400" fontSize="xs" fontWeight="bold" textTransform="uppercase">The Pull</Text>
                <Text color="whiteAlpha.800" fontSize="sm" lineHeight="tall">Then one hits. The colour doesn&apos;t ease in, it floods. He&apos;d forgotten anything could be this loud. For the first time in longer than he can count, the world isn&apos;t grey.</Text>
              </VStack>

              <VStack align="start" gap={2}>
                <Text color="cyan.300" fontSize="xs" fontWeight="bold" textTransform="uppercase">The Comeback</Text>
                <Text color="whiteAlpha.800" fontSize="sm" lineHeight="tall">One pull doesn&apos;t undo two rugs and a liquidation. But he pulls again. Not chasing the number anymore. Chasing the feeling of the grey breaking, one capsule at a time.</Text>
              </VStack>

              <Box w="full" h="1px" bg="whiteAlpha.200" my={2} />

              <VStack align="start" gap={2} w="full">
                <Text color="white" fontSize="xs" fontWeight="bold" textTransform="uppercase">Colour Machine</Text>
                <Text color="whiteAlpha.800" fontSize="sm" lineHeight="tall">Colour has to be earned. Complete tasks, refer friends, fill your coin balance. Use it to operate the claw.</Text>
                <Flex gap={4} w="full" mt={2} direction={{ base: 'column', md: 'row' }}>
                  <Box flex={1} p={4} bg="whiteAlpha.100" borderRadius="xl" border="1px solid" borderColor="cyan.400">
                    <Text color="cyan.300" fontWeight="bold" fontSize="sm" mb={1}>GUARANTEED</Text>
                    <Text color="whiteAlpha.700" fontSize="xs">your spot is locked, no matter what.</Text>
                  </Box>
                  <Box flex={1} p={4} bg="whiteAlpha.100" borderRadius="xl" border="1px solid" borderColor="pink.400">
                    <Text color="pink.400" fontWeight="bold" fontSize="sm" mb={1}>FIRST COME FIRST SERVED</Text>
                    <Text color="whiteAlpha.700" fontSize="xs">colour&apos;s real, but it&apos;s racing the clock.</Text>
                  </Box>
                </Flex>
              </VStack>

            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        user={user}
        onConnectWallet={connectWallet}
        onLinkTwitter={async (username) => {
          try {
            const res = await fetch('/api/auth/twitter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username }),
            });
            if (res.ok) {
              await fetchUser();
              return true;
            } else {
              const data = await res.json();
              toast({ title: data.message || 'Error linking Twitter', status: 'error' });
              return false;
            }
          } catch (e: any) {
            toast({ title: 'Error linking Twitter', status: 'error' });
            return false;
          }
        }}
        onRefreshUser={fetchUser}
      />
    </Box>
  );
}
"""

content = content[:start_idx] + new_ui

with open('/Users/ayushpahuja/Downloads/ClawMachine_Template/game/blnk-flywheel/app/page.tsx', 'w') as f:
    f.write(content)

print("Restored neon UI theme to app/page.tsx")
