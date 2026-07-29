'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Flex, Heading, Text, VStack, HStack, SimpleGrid, useToast } from '@chakra-ui/react';
import { BrowserProvider, getAddress } from 'ethers';
import { SiweMessage } from 'siwe';
import { useRouter } from 'next/navigation';
import SpotlightCard from '@/components/SpotlightCard';
import SoundButton from '@/components/SoundButton';
import { soundManager } from '@/lib/sound';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function Dashboard() {
  const [address, setAddress] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setAddress(data.address);
        setUser(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const connectWallet = async () => {
    soundManager.playClick();
    try {
      if (!window.ethereum) {
        toast({ title: 'MetaMask not found', status: 'error' });
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      const address = getAddress(accounts[0]);

      const nonceRes = await fetch('/api/auth/nonce');
      const nonce = await nonceRes.text();

      const network = await provider.getNetwork();
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in with Ethereum to BLNK',
        uri: window.location.origin,
        version: '1',
        chainId: Number(network.chainId),
        nonce,
      });

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message.prepareMessage());

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.message || 'Error verifying message');
      }
      
      toast({ title: 'Successfully signed in', status: 'success' });
      soundManager.playWin();
      fetchUser();
    } catch (e: any) {
      toast({ title: e.message || 'Error connecting', status: 'error' });
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="#060d08" color="white" display="flex" alignItems="center" justifyContent="center">
        <Text fontFamily="var(--font-pixel)" fontSize="md" color="green.400" letterSpacing="wider">
          LOADING BLNK...
        </Text>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#060d08" color="white" position="relative" overflowX="hidden" pb={20}>
      {/* Old CRT Monochrome Phosphor Green Scanline / Grid Background */}
      <Box
        position="absolute"
        inset={0}
        pointerEvents="none"
        opacity={0.12}
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(34, 197, 94, 0.25) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(34, 197, 94, 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      <VStack gap={10} align="center" maxW="container.xl" mx="auto" px={{ base: 4, md: 8 }} py={8} position="relative" zIndex={10}>
        
        {/* Retro Header Bar with Sound Mute & Title */}
        <Flex w="full" justify="space-between" align="center" wrap="wrap" gap={4}>
          <HStack gap={3}>
            <Heading
              size="md"
              fontFamily="var(--font-pixel)"
              letterSpacing="0.1em"
              color="green.400"
              textShadow="2px 2px 0px #052e16"
            >
              BLNK
            </Heading>
            <Box bg="#0f2416" border="2px solid" borderColor="#166534" px={2} py={1}>
              <Text fontSize="xs" fontFamily="var(--font-pixel)" color="yellow.400">
                v1.0
              </Text>
            </Box>
          </HStack>

          <HStack gap={4}>
            <SoundButton />
            {address && (
              <Button
                size="sm"
                className="pixel-button"
                fontFamily="var(--font-pixel)"
                fontSize="xs"
                px={4}
                h="36px"
                rounded="none"
                onClick={() => {
                  soundManager.playClick();
                  router.push('/game');
                }}
              >
                🎮 PLAY GAME
              </Button>
            )}
          </HStack>
        </Flex>

        {/* Hero Title in CRT Green Arcade Style */}
        <VStack gap={3} textAlign="center" pt={4}>
          <Heading
            size={{ base: 'lg', md: 'xl' }}
            fontFamily="var(--font-pixel)"
            letterSpacing="0.08em"
            color="green.300"
            textShadow="3px 3px 0px #14532d"
            lineHeight="1.5"
          >
            THE WHITELIST FLYWHEEL
          </Heading>
          <Text fontSize={{ base: 'xl', md: '2xl' }} fontFamily="var(--font-retro)" color="green.200" maxW="2xl" letterSpacing="0.05em">
            A next-gen interactive whitelist flywheel on Ethereum. Link socials, earn coins, and drop the claw to capture rare rewards.
          </Text>
        </VStack>

        {/* Retro RPG Arcade Quest 'How to Play' Section with Phosphor Green Spotlight */}
        <Box w="full" maxW="4xl">
          <SpotlightCard
            p={{ base: 6, md: 8 }}
            spotlightColor="rgba(34, 197, 94, 0.35)"
            bg="#0b1810"
            border="4px solid"
            borderColor="#166534"
            boxShadow="0 6px 0 #050a06, inset 0 2px 0 rgba(74, 222, 128, 0.15)"
            rounded="none"
          >
            <VStack gap={8} w="full">
              {/* Header Badge */}
              <VStack gap={2}>
                <HStack gap={3} color="yellow.400" fontFamily="var(--font-pixel)" fontSize={{ base: 'sm', md: 'md' }}>
                  <span>🛡️</span>
                  <Text letterSpacing="0.1em" textTransform="uppercase">HOW TO PLAY</Text>
                  <span>🛡️</span>
                </HStack>
                <Text fontSize="xl" fontFamily="var(--font-retro)" color="green.200">
                  Everything the scrolls know, in three steps.
                </Text>
              </VStack>

              {/* Quest Subtitle */}
              <VStack gap={1}>
                <HStack color="green.400" fontFamily="var(--font-pixel)" fontSize="xs">
                  <span>⚔️</span>
                  <Text textTransform="uppercase" letterSpacing="0.1em">THE QUEST</Text>
                  <span>⚔️</span>
                </HStack>
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontFamily="var(--font-retro)" color="green.100" textAlign="center" maxW="xl">
                  A whitelist flywheel on BLNK. Spend Coins, drop the claw, and cut a path through colorful prize capsules — each grab a chance to unlock your spot.
                </Text>
              </VStack>

              {/* 3 Step Quest Guide - Retro CRT Green Arcade Slots */}
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={5} w="full">
                <SpotlightCard
                  p={5}
                  spotlightColor="rgba(74, 222, 128, 0.4)"
                  bg="#0f2416"
                  border="2px solid"
                  borderColor="#166534"
                  boxShadow="0 3px 0 #050a06"
                  rounded="none"
                >
                  <VStack align="start" gap={3}>
                    <HStack color="green.300" fontFamily="var(--font-pixel)" fontSize="xs">
                      <span>1 · CREATE</span>
                    </HStack>
                    <Text fontSize="lg" fontFamily="var(--font-retro)" color="green.50" lineHeight="1.4">
                      Link your wallet and Twitter. Your champion enters the flywheel with starting Coins.
                    </Text>
                  </VStack>
                </SpotlightCard>

                <SpotlightCard
                  p={5}
                  spotlightColor="rgba(245, 158, 11, 0.35)"
                  bg="#0f2416"
                  border="2px solid"
                  borderColor="#d97706"
                  boxShadow="0 3px 0 #050a06"
                  rounded="none"
                >
                  <VStack align="start" gap={3}>
                    <HStack color="yellow.400" fontFamily="var(--font-pixel)" fontSize="xs">
                      <span>2 · FIGHT</span>
                    </HStack>
                    <Text fontSize="lg" fontFamily="var(--font-retro)" color="green.50" lineHeight="1.4">
                      Take on the claw machine. Position the joystick over the pile and drop to grab a prize capsule.
                    </Text>
                  </VStack>
                </SpotlightCard>

                <SpotlightCard
                  p={5}
                  spotlightColor="rgba(34, 197, 94, 0.4)"
                  bg="#0f2416"
                  border="2px solid"
                  borderColor="#15803d"
                  boxShadow="0 3px 0 #050a06"
                  rounded="none"
                >
                  <VStack align="start" gap={3}>
                    <HStack color="green.400" fontFamily="var(--font-pixel)" fontSize="xs">
                      <span>3 · GROW</span>
                    </HStack>
                    <Text fontSize="lg" fontFamily="var(--font-retro)" color="green.50" lineHeight="1.4">
                      Click your captured capsule to reveal what&apos;s inside. Pull color drops to secure your whitelist spot.
                    </Text>
                  </VStack>
                </SpotlightCard>
              </SimpleGrid>

              {/* Grand Prize Banner */}
              <Box
                w="full"
                p={4}
                bg="#0b1810"
                border="2px solid"
                borderColor="yellow.500"
                boxShadow="0 3px 0 #050a06"
                textAlign="center"
              >
                <Text fontFamily="var(--font-pixel)" fontSize="xs" color="yellow.300">
                  🏆 PULL GUARANTEED AND WIN THE GRAND PRIZE WHITELIST
                </Text>
                <Text fontSize="lg" fontFamily="var(--font-retro)" color="green.200" mt={1}>
                  Nobody gets there on the first try. That is the point.
                </Text>
              </Box>
            </VStack>
          </SpotlightCard>
        </Box>

        {/* User Dashboard / Wallet / Action Buttons */}
        {!address ? (
          <Box pt={4}>
            <Button
              size="lg"
              h="64px"
              px={10}
              className="pixel-button"
              fontFamily="var(--font-pixel)"
              fontSize={{ base: 'xs', md: 'sm' }}
              rounded="none"
              onClick={connectWallet}
            >
              ⚡ CONNECT WALLET TO PLAY
            </Button>
          </Box>
        ) : (
          <VStack gap={8} w="full" maxW="4xl" align="stretch">
            {/* Wallet & Coins Retro RPG Status Box */}
            <SpotlightCard
              p={6}
              spotlightColor="rgba(74, 222, 128, 0.35)"
              bg="#0b1810"
              border="4px solid"
              borderColor="#166534"
              boxShadow="0 4px 0 #050a06"
              rounded="none"
            >
              <Flex
                justify="space-between"
                align="center"
                wrap="wrap"
                gap={4}
              >
                <VStack align="start" gap={1}>
                  <Text color="green.400" fontSize="xs" fontFamily="var(--font-pixel)" textTransform="uppercase">
                    CHAMPION WALLET
                  </Text>
                  <Text fontFamily="var(--font-retro)" fontSize="2xl" color="white">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </Text>
                </VStack>
                <VStack align={{ base: 'start', sm: 'end' }} gap={1}>
                  <Text color="yellow.400" fontSize="xs" fontFamily="var(--font-pixel)" textTransform="uppercase">
                    YOUR COINS
                  </Text>
                  <Heading size="md" fontFamily="var(--font-pixel)" color="yellow.300">
                    ◈ {user?.coins || 0}
                  </Heading>
                </VStack>
              </Flex>
            </SpotlightCard>

            {/* Content Grid (Tasks & Referrals) */}
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
              {/* Tasks Card */}
              <SpotlightCard
                p={6}
                spotlightColor="rgba(34, 197, 94, 0.35)"
                bg="#0b1810"
                border="2px solid"
                borderColor="#166534"
                boxShadow="0 3px 0 #050a06"
                rounded="none"
              >
                <HStack mb={2}>
                  <Text color="green.400" fontFamily="var(--font-pixel)" fontSize="xs">⚔️</Text>
                  <Heading size="xs" fontFamily="var(--font-pixel)" color="green.300">TASKS</Heading>
                </HStack>
                <Text color="green.100" fontFamily="var(--font-retro)" fontSize="xl" mb={6}>
                  Complete tasks to earn coins and play the claw machine.
                </Text>
                
                {user?.twitterLinked ? (
                  <Box p={3} bg="#14532d" border="2px solid" borderColor="#22c55e" color="white" textAlign="center" fontFamily="var(--font-retro)" fontSize="xl">
                    ✓ Twitter Linked ({user.twitterHandle})
                  </Box>
                ) : (
                  <VStack gap={3}>
                    <Text color="green.200" fontFamily="var(--font-retro)" fontSize="lg" w="full" textAlign="left">Enter your Twitter handle (+10 Coins):</Text>
                    <Flex w="full" gap={2}>
                      <Box
                        as="input"
                        id="twitterInput"
                        placeholder="@handle"
                        bg="#050a06"
                        color="white"
                        p={2.5}
                        fontFamily="var(--font-retro)"
                        fontSize="xl"
                        border="2px solid"
                        borderColor="#166534"
                        _focus={{ outline: 'none', borderColor: '#22c55e' }}
                      />
                      <Button
                        className="pixel-button"
                        fontFamily="var(--font-pixel)"
                        fontSize="2xs"
                        px={4}
                        rounded="none"
                        onClick={async () => {
                          soundManager.playClick();
                          const val = (document.getElementById('twitterInput') as HTMLInputElement).value;
                          if (!val) return toast({ title: 'Enter a handle', status: 'warning' });
                          try {
                            const res = await fetch('/api/tasks/twitter', { method: 'POST', body: JSON.stringify({ handle: val }) });
                            const data = await res.json();
                            if (res.ok) {
                              toast({ title: 'Twitter linked! +10 Coins', status: 'success' });
                              soundManager.playWin();
                              setUser({ ...user, twitterLinked: true, twitterHandle: data.handle, coins: data.coins });
                            } else {
                              toast({ title: data.message, status: 'error' });
                            }
                          } catch (e) {
                            toast({ title: 'Error linking Twitter', status: 'error' });
                          }
                        }}
                      >
                        LINK
                      </Button>
                    </Flex>
                  </VStack>
                )}
              </SpotlightCard>

              {/* Referrals Card */}
              <SpotlightCard
                p={6}
                spotlightColor="rgba(245, 158, 11, 0.35)"
                bg="#0b1810"
                border="2px solid"
                borderColor="#d97706"
                boxShadow="0 3px 0 #050a06"
                rounded="none"
              >
                <HStack mb={2}>
                  <Text color="yellow.400" fontFamily="var(--font-pixel)" fontSize="xs">📜</Text>
                  <Heading size="xs" fontFamily="var(--font-pixel)" color="yellow.400">REFERRALS</Heading>
                </HStack>
                <Text color="green.100" fontFamily="var(--font-retro)" fontSize="xl" mb={6}>
                  Invite friends to earn additional color drops and chances.
                </Text>
                
                <Box p={4} bg="#0f2416" border="2px solid" borderColor="#166534" textAlign="center">
                  <Text color="green.300" fontSize="xs" fontFamily="var(--font-pixel)" mb={2} textTransform="uppercase">YOUR INVITE CODE</Text>
                  <Text fontWeight="black" fontSize="2xl" fontFamily="var(--font-pixel)" color="yellow.300" letterSpacing="widest">
                    {user?.referralCode || '------'}
                  </Text>
                </Box>
              </SpotlightCard>
            </SimpleGrid>

            {/* Play Claw Machine CTA Button - Redirects directly to /game */}
            <Box pt={4}>
              <Button
                size="lg"
                h="74px"
                w="full"
                className="pixel-button"
                fontFamily="var(--font-pixel)"
                fontSize={{ base: 'sm', md: 'md' }}
                letterSpacing="widest"
                rounded="none"
                onClick={() => {
                  soundManager.playClick();
                  router.push('/game');
                }}
              >
                🕹️ ENTER CLAW MACHINE
              </Button>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
}
