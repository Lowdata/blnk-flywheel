'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Button, Flex, Heading, Text, VStack, HStack,
  useToast, Modal, ModalOverlay, ModalContent,
  ModalBody, ModalCloseButton, Skeleton,
  Tooltip,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import OnboardingModal from '@/components/OnboardingModal';
import { soundManager } from '@/lib/sound';

// wagmi + RainbowKit hooks
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [verifyingTasks, setVerifyingTasks] = useState<{ [taskId: string]: number }>({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeModal, setActiveModal] = useState<'about' | null>(null);
  const [siweLoading, setSiweLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  // Tracks whether the user explicitly logged out to prevent SIWE re-triggering
  const didLogout = useRef(false);
  const onboardingDismissed = useRef(false);

  const toast = useToast();
  const router = useRouter();

  // Wagmi / RainbowKit hooks
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  // --- Show onboarding only when connected but incomplete (not after logout) ---
  useEffect(() => {
    if (!loading && isConnected && !didLogout.current && !onboardingDismissed.current) {
      if (!user || !user.twitterLinked || !user.referredBy) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    }
    if (!isConnected || didLogout.current) {
      setShowOnboarding(false);
      if (!isConnected) {
        onboardingDismissed.current = false;
      }
    }
  }, [loading, user, isConnected]);

  // --- SIWE sign-in when wallet connects ------------------------
  const performSiweSignIn = useCallback(async (connectedAddress: string) => {
    if (siweLoading) return;
    setSiweLoading(true);
    try {
      const { SiweMessage } = await import('siwe');

      const nonceRes = await fetch('/api/auth/nonce');
      if (!nonceRes.ok) {
        const err = await nonceRes.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch nonce');
      }
      const nonce = await nonceRes.text();

      const message = new SiweMessage({
        domain: window.location.host,
        address: connectedAddress,
        statement: 'Sign in with Ethereum to BLNK',
        uri: window.location.origin,
        version: '1',
        chainId: 1, // wagmi handles the actual chain
        nonce,
      });

      const preparedMessage = message.prepareMessage();
      const signature = await signMessageAsync({ message: preparedMessage });

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, signature }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.message || 'Verification failed');
      }

      toast({ title: 'Successfully signed in', status: 'success', duration: 3000 });
      soundManager.playWin();
      await fetchUser();
      await fetchTasks();
    } catch (e: any) {
      // User rejected signature — disconnect cleanly
      if (e?.message?.includes('User rejected') || e?.code === 4001) {
        disconnect();
        toast({ title: 'Signature rejected', description: 'You must sign the message to continue.', status: 'warning', duration: 3000 });
      } else {
        toast({ title: e.message || 'Error signing in', status: 'error', duration: 4000 });
      }
    } finally {
      setSiweLoading(false);
    }
  }, [siweLoading, signMessageAsync, disconnect, toast]);

  // --- Trigger SIWE when wallet connects but no session user ----
  useEffect(() => {
    // Don't re-trigger SIWE if the user just explicitly logged out
    if (didLogout.current) return;
    if (isConnected && address && !user && !loading && !siweLoading) {
      performSiweSignIn(address);
    }
  }, [isConnected, address, user, loading]);

  // --- API helpers -----------------------------------------------
  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
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
  }, [user?._id]);

  // --- Connect wallet (opens RainbowKit modal) ------------------
  const connectWallet = () => {
    soundManager.playClick();
    didLogout.current = false; // allow SIWE triggers when reconnecting
    openConnectModal?.();
  };

  // --- Logout ---------------------------------------------------
  const handleLogout = async () => {
    soundManager.playClick();
    try {
      didLogout.current = true; // prevent SIWE re-trigger and Onboarding modal open
      setShowOnboarding(false);
      await fetch('/api/auth/logout', { method: 'POST' });
      disconnect(); // Disconnect from wagmi/wallet
      setUser(null);
      setTasks([]);
      toast({ title: 'Disconnected', status: 'info', duration: 2000 });
    } catch (e) {
      didLogout.current = false; // allow retry
      toast({ title: 'Logout failed', status: 'error' });
    }
  };

  // --- Copy address to clipboard --------------------------------
  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  // --- Copy referral to clipboard --------------------------------
  const handleCopyReferral = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  // --- Task completion ------------------------------------------
  const handleTaskClick = (task: any) => {
    if (!user) return;
    const isCompleted = user.completedTasks?.some(
      (ct: any) =>
        (ct._id || ct).toString() === (task._id || '').toString() || ct.taskId === task.taskId
    );

    if (task.type === 'referral' && isCompleted) {
      soundManager.playClick();
      if (task.taskUrl) window.open(task.taskUrl, '_blank');
      toast({ title: 'Referral link opened!', description: 'Share with friends.', status: 'info', duration: 3000 });
      return;
    }

    if (isCompleted || verifyingTasks[task.taskId]) return;
    soundManager.playClick();
    if (task.taskUrl) window.open(task.taskUrl, '_blank');

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
            toast({ title: `Task verified! +${task.rewardAmount} Coins`, status: 'success', duration: 3000 });
            setUser((prevUser: any) => {
              if (!prevUser) return null;
              return {
                ...prevUser,
                coins: data.coins,
                twitterLinked: task.taskId === 'twitter_connect' ? true : prevUser.twitterLinked,
                twitterHandle:
                  task.taskId === 'twitter_connect'
                    ? prevUser.twitterHandle || '@BLNK_Member'
                    : prevUser.twitterHandle,
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


  // --- Loading skeleton -----------------------------------------
  if (loading) {
    return (
      <Box minH="100vh" bg="gray.900" color="white" display="flex" alignItems="center" justifyContent="center">
        <VStack gap={6} w="full" maxW="3xl" px={8}>
          <Skeleton height="60px" width="200px" startColor="purple.900" endColor="purple.700" borderRadius="xl" />
          <Skeleton height="24px" width="140px" startColor="gray.800" endColor="gray.700" borderRadius="md" />
          <Skeleton height="80px" width="full" startColor="gray.800" endColor="gray.700" borderRadius="2xl" />
          <HStack w="full" gap={6}>
            <Skeleton flex={1} height="200px" startColor="gray.800" endColor="gray.700" borderRadius="2xl" />
            <Skeleton flex={1} height="200px" startColor="gray.800" endColor="gray.700" borderRadius="2xl" />
          </HStack>
        </VStack>
      </Box>
    );
  }

  const displayAddress = address || user?.walletAddress;

  return (
    <Box
      minH="100vh"
      bg="gray.900"
      color="white"
      position="relative"
      overflow="hidden"
      display="flex"
      flexDirection="column"
      fontFamily="var(--font-inter), sans-serif"
      className="animate-fade-in"
    >
      {/* Background Ambient Glow */}
      <Box position="absolute" top="-20%" left="-10%" w="50vw" h="50vw" bg="purple.600" filter="blur(150px)" opacity={0.5} borderRadius="full" pointerEvents="none" />
      <Box position="absolute" bottom="-20%" right="-10%" w="50vw" h="50vw" bg="teal.400" filter="blur(150px)" opacity={0.4} borderRadius="full" pointerEvents="none" />

      {/* --- Sticky Header / Navbar --- */}
      <Flex
        position="sticky"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        px={{ base: 4, md: 6 }}
        py={3}
        align="center"
        justify="space-between"
        bg="blackAlpha.700"
        backdropFilter="blur(20px)"
        borderBottom="1px solid"
        borderColor="whiteAlpha.100"
      >
        {/* Logo */}
        <Text
          fontWeight="black"
          fontSize="xl"
          letterSpacing="0.25em"
          textTransform="uppercase"
          bgGradient="linear(to-r, white, whiteAlpha.600)"
          bgClip="text"
        >
          BLNK
        </Text>

        {/* Center: Leaderboard - visible with Soon badge */}
        <Tooltip label="Leaderboard coming soon" placement="bottom">
          <Flex align="center" gap={1.5} px={3} py={1.5} rounded="full" bg="whiteAlpha.100" border="1px solid" borderColor="whiteAlpha.200" cursor="default">
            <Text fontSize="sm">🏆</Text>
            <Text fontSize="xs" fontWeight="medium" color="whiteAlpha.800" display={{ base: 'none', sm: 'block' }}>Leaderboard</Text>
            <Box px={1.5} py={0.5} rounded="full" bg="whiteAlpha.300" color="white" fontSize="3xs" fontWeight="bold">
              SOON
            </Box>
          </Flex>
        </Tooltip>

        {/* Right: connection + wallet + coins + disconnect */}
        <Flex align="center" gap={{ base: 2, md: 3 }}>
          {siweLoading && (
            <Text fontSize="xs" color="whiteAlpha.500" fontFamily="monospace" display={{ base: 'none', md: 'block' }}>
              Signing in…
            </Text>
          )}

          {displayAddress ? (
            <>
              {/* Connection status dot - desktop only to prevent overflow on mobile */}
              <Flex align="center" gap={1.5} display={{ base: 'none', md: 'flex' }}>
                <Box
                  w={2}
                  h={2}
                  borderRadius="full"
                  bg="green.400"
                  boxShadow="0 0 6px 2px rgba(72,187,120,0.6)"
                />
                <Text fontSize="xs" color="green.400" fontWeight="semibold">
                  Connected
                </Text>
              </Flex>

              {/* Wallet address - hidden on mobile */}
              <Tooltip label={copiedAddress ? 'Copied!' : 'Click to copy address'} placement="bottom">
                <HStack
                  cursor="pointer"
                  onClick={handleCopyAddress}
                  bg="whiteAlpha.100"
                  px={3}
                  py={1.5}
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  _hover={{ bg: 'whiteAlpha.200', borderColor: 'cyan.500' }}
                  transition="all 0.2s"
                  gap={1.5}
                  display={{ base: 'none', md: 'flex' }}
                >
                  <Text fontFamily="monospace" fontSize="sm" fontWeight="semibold" color="cyan.300">
                    {displayAddress.slice(0, 6)}…{displayAddress.slice(-4)}
                  </Text>
                  <Text fontSize="xs" color={copiedAddress ? 'green.400' : 'whiteAlpha.400'}>
                    {copiedAddress ? '✓' : '⎘'}
                  </Text>
                </HStack>
              </Tooltip>

              {/* Coins */}
              <Flex
                align="center"
                gap={1.5}
                bg="whiteAlpha.100"
                px={{ base: 2.5, md: 3 }}
                py={1.5}
                borderRadius="lg"
                border="1px solid"
                borderColor="whiteAlpha.200"
              >
                <Text fontSize="xs" color="whiteAlpha.700" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">
                  Coins
                </Text>
                <Text fontWeight="black" fontSize="sm" color="white">{user?.coins ?? 0}</Text>
              </Flex>

              {/* Disconnect - icon only on mobile, text on desktop */}
              <Button
                size="sm"
                variant="ghost"
                color="whiteAlpha.500"
                fontWeight="medium"
                px={{ base: 2, md: 3 }}
                minW="auto"
                _hover={{ color: 'red.400', bg: 'whiteAlpha.100' }}
                onClick={handleLogout}
                aria-label="Disconnect"
              >
                <Text display={{ base: 'block', md: 'none' }}>✕</Text>
                <Text display={{ base: 'none', md: 'block' }}>Disconnect</Text>
              </Button>
            </>
          ) : (
            /* Not connected status */
            <Flex align="center" gap={1.5}>
              <Box
                w={2}
                h={2}
                borderRadius="full"
                bg="red.400"
                boxShadow="0 0 6px 2px rgba(245,101,101,0.5)"
              />
              <Text fontSize="xs" color="red.400" fontWeight="semibold" display={{ base: 'none', sm: 'block' }}>
                Not connected
              </Text>
            </Flex>
          )}
        </Flex>
      </Flex>

      <VStack
        gap={{ base: 3, md: 5 }}
        align="center"
        maxW="4xl"
        mx="auto"
        px={{ base: 3, md: 8 }}
        py={{ base: 4, md: 6 }}
        position="relative"
        zIndex={10}
        minH="calc(100vh - 56px)"
        w="full"
        justify={{ base: 'flex-start', md: 'center' }}
        pt={{ base: 6, md: 0 }}
      >
        {/* --- Connect / Dashboard --- */}
        {!displayAddress ? (
          <Box pt={2} className="animate-float-in">
            {/* SIWE signing in progress overlay */}
            {siweLoading ? (
              <VStack gap={3}>
                <Button
                  size="xl"
                  h="80px"
                  px={12}
                  fontSize="2xl"
                  fontWeight="bold"
                  rounded="full"
                  bgGradient="linear(to-r, cyan.400, purple.500)"
                  color="white"
                  isLoading
                  loadingText="Signing in…"
                  transition="all 0.3s ease"
                  boxShadow="0 0 30px rgba(159, 122, 234, 0.6)"
                />
                <Text fontSize="xs" color="whiteAlpha.500">
                  Sign the message in your wallet to continue
                </Text>
              </VStack>
            ) : (
              <VStack gap={5}>
                <VStack gap={1} textAlign="center">
                  <Heading
                    size="4xl"
                    letterSpacing="0.2em"
                    fontWeight="black"
                    textTransform="uppercase"
                    bgGradient="linear(to-r, cyan.400, purple.500, pink.500)"
                    bgClip="text"
                  >
                    BLNK
                  </Heading>
                  <Text fontSize="lg" color="whiteAlpha.700" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
                    black to ink.
                  </Text>
                </VStack>
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
                  className="animate-pulse-glow"
                  onClick={connectWallet}
                >
                  CONNECT TO ENTER
                </Button>
                <Flex gap={3} align="center" flexWrap="wrap" justify="center">
                  <Text fontSize="xs" color="whiteAlpha.400">Supports</Text>
                  {['MetaMask', 'Phantom', 'Rainbow', 'Trust'].map((w) => (
                    <Text key={w} fontSize="xs" color="whiteAlpha.600" fontWeight="semibold">
                      {w}
                    </Text>
                  ))}
                </Flex>
              </VStack>
            )}
          </Box>
        ) : (
          <VStack gap={{ base: 3, md: 4 }} w="full" align="stretch" maxW="3xl" className="animate-float-in">

            {/* --- Hero (compact) - visible on mobile and desktop for balanced layout --- */}
            <VStack gap={0} textAlign="center" pb={1}>
              <Heading
                size={{ base: '2xl', md: '4xl' }}
                letterSpacing="0.2em"
                fontWeight="black"
                textTransform="uppercase"
                bgGradient="linear(to-r, white, whiteAlpha.600)"
                bgClip="text"
              >
                BLNK
              </Heading>
              <Text fontSize="sm" color="whiteAlpha.600" fontWeight="bold" letterSpacing="widest" textTransform="uppercase">
                black to ink.
              </Text>
            </VStack>

            {/* --- Tasks & Referrals Grid --- */}
            <Flex gap={{ base: 4, md: 6 }} direction={{ base: 'column', md: 'row' }} w="full">

              {/* Tasks Card */}
              <Box
                flex={1}
                bgGradient="linear(to-br, whiteAlpha.200, whiteAlpha.50)"
                backdropFilter="blur(20px)"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={{ base: 3, md: 5 }}
                rounded="2xl"
                position="relative"
                overflow="hidden"
                display="flex"
                flexDirection="column"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, right: 0, h: '3px',
                  bgGradient: 'linear(to-r, whiteAlpha.500, whiteAlpha.200)',
                }}
              >
                <HStack justify="space-between" align="center" mb={3}>
                  <Heading size="md">Tasks</Heading>
                  <Text fontSize="xs" color="whiteAlpha.500">Complete to earn coins</Text>
                </HStack>

                <VStack align="stretch" gap={2}>
                  {tasks.map((task: any) => {
                    const isCompleted = user?.completedTasks?.some(
                      (ct: any) =>
                        (ct._id || ct).toString() === (task._id || '').toString() || ct.taskId === task.taskId
                    );
                    const isVerifying = verifyingTasks[task.taskId];
                    return (
                      <Flex key={task.taskId} justify="space-between" align="center" p={2.5} bg="blackAlpha.400" borderRadius="lg">
                        <Text fontSize="sm" color="whiteAlpha.900" fontWeight="medium">{task.description}</Text>
                        <Button
                          size="sm"
                          bg={isCompleted ? 'whiteAlpha.200' : 'cyan.400'}
                          color={isCompleted ? 'whiteAlpha.500' : 'black'}
                          fontWeight="bold"
                          rounded="md"
                          h={7}
                          fontSize="xs"
                          flexShrink={0}
                          ml={2}
                          isLoading={!!isVerifying}
                          isDisabled={isCompleted}
                          onClick={() => handleTaskClick(task)}
                          _hover={!isCompleted ? { bg: 'cyan.300' } : {}}
                        >
                          {isCompleted ? 'Done' : `+${task.rewardAmount}`}
                        </Button>
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>

              {/* Referrals Card - full card on desktop */}
              <Box
                display={{ base: 'none', md: 'block' }}
                bgGradient="linear(to-br, whiteAlpha.200, whiteAlpha.50)"
                backdropFilter="blur(20px)"
                border="1px solid"
                borderColor="whiteAlpha.200"
                p={5}
                rounded="2xl"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0, left: 0, right: 0, h: '4px',
                  bgGradient: 'linear(to-r, whiteAlpha.600, whiteAlpha.200)',
                }}
              >
                <VStack align="start" gap={3}>
                  <VStack align="start" gap={0.5}>
                    <Heading size="md">Referrals</Heading>
                    <Text color="whiteAlpha.600" fontSize="sm">Invite friends to earn additional color drops.</Text>
                  </VStack>
                  <Box px={4} py={2.5} bg="blackAlpha.500" rounded="lg" border="1px solid" borderColor="whiteAlpha.200" w="full">
                    <Text color="gray.500" fontSize="xs" mb={1} textTransform="uppercase" letterSpacing="widest">Your Invite Code</Text>
                    <Tooltip label={copiedReferral ? 'Copied!' : 'Click to copy'} placement="top">
                      <HStack cursor="pointer" onClick={handleCopyReferral} transition="all 0.2s" justify="space-between">
                        <Text fontWeight="black" fontSize="xl" color="white" letterSpacing="widest" fontFamily="monospace">
                          {user?.referralCode || '------'}
                        </Text>
                        <Text fontSize="sm" color={copiedReferral ? 'green.400' : 'whiteAlpha.400'}>
                          {copiedReferral ? '✓ Copied' : '⎘ Copy'}
                        </Text>
                      </HStack>
                    </Tooltip>
                  </Box>
                </VStack>
              </Box>

              {/* Referrals - compact strip on mobile */}
              <Tooltip label={copiedReferral ? 'Copied!' : 'Tap to copy invite code'} placement="top">
                <Flex
                  display={{ base: 'flex', md: 'none' }}
                  align="center"
                  justify="space-between"
                  bg="whiteAlpha.100"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  px={4}
                  py={3}
                  rounded="xl"
                  cursor="pointer"
                  onClick={handleCopyReferral}
                  position="relative"
                  overflow="hidden"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0, left: 0, right: 0, h: '2px',
                    bgGradient: 'linear(to-r, whiteAlpha.600, whiteAlpha.200)',
                  }}
                  _hover={{ bg: 'whiteAlpha.200' }}
                  transition="all 0.2s"
                >
                  <HStack gap={2}>
                    <Text fontSize="xs" color="whiteAlpha.700" fontWeight="bold" textTransform="uppercase" letterSpacing="wider">Referral</Text>
                    <Text fontWeight="black" fontSize="md" color="white" letterSpacing="widest" fontFamily="monospace">
                      {user?.referralCode || '------'}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={copiedReferral ? 'green.400' : 'whiteAlpha.400'} fontWeight="semibold">
                    {copiedReferral ? '✓ Copied' : '⎘ Copy'}
                  </Text>
                </Flex>
              </Tooltip>
            </Flex>

            {/* --- Play CTA --- */}
            <Button
              h={{ base: '60px', md: '70px' }}
              w="full"
              fontSize={{ base: 'xl', md: '2xl' }}
              fontWeight="black"
              letterSpacing="widest"
              bg="white"
              color="black"
              rounded="2xl"
              _hover={{ transform: 'translateY(-3px)', boxShadow: '0 16px 36px rgba(255,255,255,0.25)' }}
              transition="all 0.3s ease"
              onClick={() => {
                soundManager.playClick();
                router.push('/game');
              }}
            >
              PLAY CLAW MACHINE
            </Button>
          </VStack>
        )}
      </VStack>

      {/* --- Floating Info Button --- */}
      <Box position="absolute" bottom={6} right={6} zIndex={20}>
        <Button
          size="sm"
          variant="outline"
          rounded="full"
          color="whiteAlpha.700"
          borderColor="whiteAlpha.300"
          _hover={{ color: 'white', borderColor: 'white', bg: 'whiteAlpha.200' }}
          onClick={() => setActiveModal('about')}
        >
          ℹ INFO
        </Button>
      </Box>

      {/* --- About Modal --- */}
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

      {/* --- Onboarding Modal --- */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          onboardingDismissed.current = true;
        }}
        user={user}
        onConnectWallet={connectWallet}
        onLinkTwitter={async (username) => {
          try {
            const res = await fetch('/api/tasks/twitter', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ handle: username }),
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
        onRefreshUser={async () => {
          await fetchUser();
          await fetchTasks();
        }}
      />
    </Box>
  );
}
