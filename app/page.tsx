'use client';

import { useState, useEffect } from 'react';
import { Box, Button, Flex, Heading, Text, VStack, HStack, SimpleGrid, useToast, Input } from '@chakra-ui/react';
import { BrowserProvider, getAddress } from 'ethers';
import { SiweMessage } from 'siwe';
import { useRouter } from 'next/navigation';
import SpotlightCard from '@/components/SpotlightCard';
import SoundButton from '@/components/SoundButton';
import OnboardingModal from '@/components/OnboardingModal';
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
  const [tasks, setTasks] = useState<any[]>([]);
  const [verifyingTasks, setVerifyingTasks] = useState<{ [taskId: string]: number }>({});
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [claimingInvite, setClaimingInvite] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const toast = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !user.twitterLinked) {
        setShowOnboarding(true);
      }
    }
  }, [loading, user]);

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

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error('Error fetching tasks:', e);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchTasks();
  }, []);

  const handleTaskClick = (task: any) => {
    if (!user) return;
    const isCompleted = user.completedTasks?.some(
      (ct: any) =>
        (ct._id || ct).toString() === (task._id || '').toString() || ct.taskId === task.taskId
    );

    if (task.type === 'referral' && isCompleted) {
      soundManager.playClick();
      if (task.taskUrl) {
        window.open(task.taskUrl, '_blank');
      }
      toast({
        title: 'Referral link opened!',
        description: 'Share with friends to grow the BLNK community.',
        status: 'info',
        duration: 3000,
      });
      return;
    }

    if (isCompleted || verifyingTasks[task.taskId]) return;

    soundManager.playClick();
    if (task.taskUrl) {
      window.open(task.taskUrl, '_blank');
    }

    let secondsLeft = 5;
    setVerifyingTasks((prev) => ({ ...prev, [task.taskId]: secondsLeft }));

    const interval = setInterval(async () => {
      secondsLeft -= 1;
      if (secondsLeft > 0) {
        setVerifyingTasks((prev) => ({ ...prev, [task.taskId]: secondsLeft }));
      } else {
        clearInterval(interval);
        setVerifyingTasks((prev) => {
          const copy = { ...prev };
          delete copy[task.taskId];
          return copy;
        });

        try {
          const res = await fetch('/api/tasks/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: task.taskId }),
          });
          const data = await res.json();
          if (res.ok) {
            soundManager.playWin();
            toast({
              title: `Task verified! +${task.rewardAmount} Coins`,
              status: 'success',
              duration: 3000,
            });
            setUser((prevUser: any) => {
              if (!prevUser) return null;
              return {
                ...prevUser,
                coins: data.coins,
                twitterLinked: task.taskId === 'twitter_connect' ? true : prevUser.twitterLinked,
                twitterHandle: task.taskId === 'twitter_connect' ? (prevUser.twitterHandle || '@BLNK_Member') : prevUser.twitterHandle,
                completedTasks: [...(prevUser.completedTasks || []), task],
              };
            });
          } else {
            toast({ title: data.message || 'Task verification failed', status: 'error' });
          }
        } catch (err) {
          toast({ title: 'Failed to complete task', status: 'error' });
        }
      }
    }, 1000);
  };

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

  const handleLogout = async () => {
    soundManager.playClick();
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setAddress(null);
      setTasks([]);
      toast({ title: 'Disconnected', status: 'info', duration: 2000 });
    } catch (e) {
      toast({ title: 'Logout failed', status: 'error' });
    }
  };

  const handleLinkTwitterModal = async (username: string): Promise<boolean> => {
    soundManager.playClick();
    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: 'twitter_connect', data: { username } }),
      });
      const data = await res.json();
      if (res.ok) {
        soundManager.playWin();
        toast({
          title: 'Twitter Linked! +10 Coins',
          status: 'success',
          duration: 3000,
        });
        await fetchUser();
        return true;
      }
      return false;
    } catch (err) {
      toast({ title: 'Failed to link Twitter', status: 'error' });
      return false;
    }
  };

  const handleClaimCardInvite = async () => {
    if (!inviteCodeInput.trim()) return;
    setClaimingInvite(true);
    soundManager.playClick();
    try {
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: inviteCodeInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        soundManager.playWin();
        toast({
          title: 'Referral Applied!',
          description: data.message || 'You earned +15 COINS welcome bonus.',
          status: 'success',
          duration: 4000,
        });
        setInviteCodeInput('');
        await fetchUser();
      } else {
        toast({
          title: 'Cannot Apply Code',
          description: data.message || 'Invalid code or already applied.',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (e) {
      toast({ title: 'Failed to claim referral code', status: 'error' });
    } finally {
      setClaimingInvite(false);
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
    <Box minH="100vh" w="100%" bg="#060d08" color="white" position="relative" pb={20} style={{ touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', overflowY: 'auto', overscrollBehaviorY: 'auto' }}>
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

          <HStack gap={{ base: 2, md: 4 }}>
            <SoundButton />
            {address && (
              <>
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
                <Button
                  size="sm"
                  bg="transparent"
                  border="1px solid"
                  borderColor="red.800"
                  color="red.400"
                  fontFamily="var(--font-pixel)"
                  fontSize={{ base: '2xs', md: 'xs' }}
                  px={3}
                  h="36px"
                  rounded="none"
                  _hover={{ bg: 'red.900', borderColor: 'red.600' }}
                  onClick={handleLogout}
                >
                  ⏻
                </Button>
              </>
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
                
                <VStack gap={3.5} w="full" align="stretch">
                  {tasks.length === 0 ? (
                    <VStack gap={3.5} w="full" align="stretch">
                      {[1, 2, 3].map((i) => (
                        <Box key={i} p={3.5} bg="#050a06" border="2px solid #166534">
                          <HStack gap={3}>
                            <Box w="24px" h="24px" bg="#14532d" borderRadius="full" className="animate-pulse" />
                            <VStack align="start" gap={1} flex={1}>
                              <Box w="60%" h="16px" bg="#14532d" className="animate-pulse" />
                              <Box w="30%" h="10px" bg="#0f2416" className="animate-pulse" />
                            </VStack>
                            <Box w="40px" h="24px" bg="#14532d" className="animate-pulse" />
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    tasks.map((task) => {
                      const isCompleted = user?.completedTasks?.some(
                        (ct: any) =>
                          (ct._id || ct).toString() === (task._id || '').toString() ||
                          ct.taskId === task.taskId
                      );
                      const isVerifying = verifyingTasks[task.taskId] !== undefined;
                      const secondsLeft = verifyingTasks[task.taskId];

                      let icon = '⚡';
                      if (task.taskId === 'twitter_connect') icon = '🔗';
                      else if (task.taskId === 'twitter_follow') icon = '🐦';
                      else if (task.taskId === 'twitter_rt') icon = '🔁';
                      else if (task.taskId === 'twitter_intent') icon = '💬';
                      else if (task.taskId === 'referral_share') icon = '🎁';

                      return (
                        <Flex
                          key={task.taskId || task._id}
                          p={3.5}
                          bg={isCompleted && task.type !== 'referral' ? '#05130a' : '#050a06'}
                          border="2px solid"
                          borderColor={isCompleted && task.type !== 'referral' ? '#166534' : isVerifying ? '#eab308' : '#22c55e'}
                          justify="space-between"
                          align="center"
                          gap={3}
                          transition="all 0.2s"
                          _hover={
                            (!isCompleted || task.type === 'referral') && !isVerifying
                              ? { borderColor: '#4ade80', transform: 'translateY(-1px)' }
                              : undefined
                          }
                        >
                          <HStack gap={3} flex={1}>
                            <Text fontSize="xl">{icon}</Text>
                            <VStack align="start" gap={0}>
                              <Text
                                color={isCompleted && task.type !== 'referral' ? 'green.400' : 'white'}
                                fontFamily="var(--font-retro)"
                                fontSize="xl"
                                textDecoration={isCompleted && task.type !== 'referral' ? 'line-through' : 'none'}
                              >
                                {task.description}
                              </Text>
                              <Text color="green.300" fontFamily="var(--font-pixel)" fontSize="3xs">
                                +{task.rewardAmount} COINS
                              </Text>
                            </VStack>
                          </HStack>

                          {isCompleted ? (
                            task.type === 'referral' ? (
                              <Button
                                size="sm"
                                bg="transparent"
                                border="1px solid"
                                borderColor="#22c55e"
                                color="green.300"
                                fontFamily="var(--font-pixel)"
                                fontSize="3xs"
                                _hover={{ bg: '#14532d' }}
                                onClick={() => handleTaskClick(task)}
                              >
                                SHARE
                              </Button>
                            ) : (
                              <Box
                                px={3}
                                py={1.5}
                                bg="#14532d"
                                border="1px solid"
                                borderColor="#22c55e"
                                color="green.200"
                                fontFamily="var(--font-pixel)"
                                fontSize="3xs"
                              >
                                ✓ DONE
                              </Box>
                            )
                          ) : isVerifying ? (
                            <Box
                              px={3}
                              py={1.5}
                              bg="#713f12"
                              border="1px solid"
                              borderColor="#eab308"
                              color="yellow.200"
                              fontFamily="var(--font-pixel)"
                              fontSize="3xs"
                              className="animate-pulse"
                            >
                              VERIFYING... ({secondsLeft}s)
                            </Box>
                          ) : (
                            <Button
                              className="pixel-button"
                              fontFamily="var(--font-pixel)"
                              fontSize="3xs"
                              px={4}
                              py={2}
                              rounded="none"
                              onClick={() => handleTaskClick(task)}
                            >
                              START
                            </Button>
                          )}
                        </Flex>
                      );
                    })
                  )}
                </VStack>
              </SpotlightCard>

              {/* Referrals Card - Arcade Cyberpunk Terminal Aesthetic */}
              <SpotlightCard
                p={6}
                spotlightColor="rgba(245, 158, 11, 0.35)"
                bg="#0b1810"
                border="2px solid"
                borderColor="#d97706"
                boxShadow="0 3px 0 #050a06"
                rounded="none"
              >
                <VStack align="stretch" gap={5}>
                  <Flex justify="space-between" align="center">
                    <HStack>
                      <Text color="yellow.400" fontFamily="var(--font-pixel)" fontSize="xs">📜</Text>
                      <Heading size="xs" fontFamily="var(--font-pixel)" color="yellow.400">REFERRAL SYSTEM</Heading>
                    </HStack>
                    <Box px={2} py={0.5} bg="#713f12" border="1px solid #eab308">
                      <Text fontFamily="var(--font-pixel)" fontSize="3xs" color="yellow.200">
                        +30 COINS / INVITE
                      </Text>
                    </Box>
                  </Flex>

                  <Text color="green.100" fontFamily="var(--font-retro)" fontSize="lg">
                    Invite friends to expand your Whitelist Flywheel chances.
                  </Text>
                
                  {/* Your Invite Code display with action buttons */}
                  <Box p={4} bg="#0f2416" border="2px solid" borderColor="#166534" textAlign="center" position="relative">
                    <Text color="green.300" fontSize="3xs" fontFamily="var(--font-pixel)" mb={2} textTransform="uppercase">
                      YOUR EXCLUSIVE INVITE CODE
                    </Text>
                    <Text fontWeight="black" fontSize="2xl" fontFamily="var(--font-pixel)" color="yellow.300" letterSpacing="widest" mb={3}>
                      {user?.referralCode || '------'}
                    </Text>
                    <HStack justify="center" gap={3}>
                      <Button
                        size="xs"
                        bg="#22c55e"
                        color="black"
                        fontFamily="var(--font-pixel)"
                        fontSize="3xs"
                        px={4}
                        _hover={{ bg: '#4ade80' }}
                        onClick={() => {
                          if (!user?.referralCode) return;
                          navigator.clipboard.writeText(user.referralCode);
                          soundManager.playClick();
                          toast({ title: 'Code copied to clipboard!', status: 'success', duration: 2000 });
                        }}
                      >
                        COPY CODE
                      </Button>
                      <Button
                        size="xs"
                        bg="#14532d"
                        color="green.200"
                        border="1px solid #22c55e"
                        fontFamily="var(--font-pixel)"
                        fontSize="3xs"
                        px={4}
                        _hover={{ bg: '#166534' }}
                        onClick={() => {
                          if (!user?.referralCode) return;
                          const url = `${window.location.origin}/?ref=${user.referralCode}`;
                          navigator.clipboard.writeText(url);
                          soundManager.playClick();
                          toast({ title: 'Invite link copied!', status: 'success', duration: 2000 });
                        }}
                      >
                        SHARE LINK
                      </Button>
                    </HStack>
                  </Box>

                  {/* Live Referral Stats HUD */}
                  <SimpleGrid columns={2} gap={3}>
                    <Box p={3} bg="#05130a" border="1px solid #166534" textAlign="center">
                      <Text color="gray.400" fontFamily="var(--font-pixel)" fontSize="3xs" mb={1}>
                        TOTAL REFERRED
                      </Text>
                      <Text color="green.400" fontFamily="var(--font-pixel)" fontSize="md">
                        {user?.referrals?.length || 0}
                      </Text>
                    </Box>
                    <Box p={3} bg="#05130a" border="1px solid #166534" textAlign="center">
                      <Text color="gray.400" fontFamily="var(--font-pixel)" fontSize="3xs" mb={1}>
                        COINS EARNED
                      </Text>
                      <Text color="yellow.400" fontFamily="var(--font-pixel)" fontSize="md">
                        {(user?.referrals?.length || 0) * 30}
                      </Text>
                    </Box>
                  </SimpleGrid>


                  {/* How It Works Guide */}
                  <Box pt={2} borderTop="1px solid #166534">
                    <Text color="yellow.400" fontFamily="var(--font-pixel)" fontSize="3xs" mb={2}>
                      HOW IT WORKS
                    </Text>
                    <VStack align="stretch" gap={1.5} color="gray.300" fontFamily="var(--font-mono)" fontSize="xs">
                      <Text>• Share your code with fellow collectors</Text>
                      <Text>• Friend receives +15 COINS welcome bonus</Text>
                      <Text>• You earn +30 COINS automatically on claim</Text>
                    </VStack>
                  </Box>
                </VStack>
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

      {/* Onboarding Modal Protocol (Wallet -> Twitter -> Invite Code) */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        user={user}
        onConnectWallet={connectWallet}
        onLinkTwitter={handleLinkTwitterModal}
        onRefreshUser={fetchUser}
      />
    </Box>
  );
}
