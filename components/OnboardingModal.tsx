'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Flex,
  Icon,
  useToast,
} from '@chakra-ui/react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onConnectWallet: () => void;
  onLinkTwitter: (username: string) => Promise<boolean>;
  onRefreshUser: () => Promise<void>;
}

export default function OnboardingModal({
  isOpen,
  onClose,
  user,
  onConnectWallet,
  onLinkTwitter,
  onRefreshUser,
}: OnboardingModalProps) {
  const [referralInput, setReferralInput] = useState('');
  const [twitterUsername, setTwitterUsername] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(!user ? 1 : !user.twitterLinked ? 2 : 3);
  const toast = useToast();

  const handleClaimReferral = async () => {
    if (!referralInput.trim()) return;
    setIsClaiming(true);
    try {
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: referralInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: 'Referral Code Applied!',
          description: data.message || 'You earned +15 COINS welcome bonus.',
          status: 'success',
          duration: 4000,
        });
        await onRefreshUser();
        onClose();
      } else {
        toast({
          title: 'Cannot Apply Code',
          description: data.message || 'Invalid code or already applied.',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: 'Failed to claim referral code.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg" closeOnOverlayClick={false}>
      <ModalOverlay bg="rgba(0, 0, 0, 0.88)" backdropFilter="blur(8px)" />
      <ModalContent
        bg="#050e08"
        border="2px solid #22c55e"
        boxShadow="0 0 35px rgba(34, 197, 94, 0.35), inset 0 0 15px rgba(34, 197, 94, 0.15)"
        borderRadius="none"
        p={6}
        color="white"
        position="relative"
        overflow="hidden"
      >
        {/* Cyberpunk accent lines */}
        <Box
          position="absolute"
          top="-2px"
          left="20%"
          right="20%"
          height="3px"
          bg="#4ade80"
          boxShadow="0 0 12px #4ade80"
        />

        <ModalBody p={0}>
          <VStack align="stretch" gap={6}>
            <VStack align="center" gap={1}>
              <Text
                fontFamily="var(--font-pixel)"
                fontSize="xs"
                color="green.400"
                letterSpacing="2px"
                textAlign="center"
              >
                SYSTEM ACCESS REQUIRED
              </Text>
              <Text
                fontFamily="var(--font-retro)"
                fontSize="3xl"
                color="white"
                textAlign="center"
                textShadow="0 0 10px rgba(74, 222, 128, 0.4)"
              >
                ONBOARDING PROTOCOL
              </Text>
            </VStack>

            {/* Stepper HUD */}
            <Flex justify="space-between" align="center" px={2}>
              <Box
                flex={1}
                p={2}
                bg={user ? '#05130a' : '#0a2312'}
                border="1px solid"
                borderColor={user ? '#22c55e' : '#eab308'}
                textAlign="center"
              >
                <Text fontFamily="var(--font-pixel)" fontSize="3xs" color={user ? 'green.400' : 'yellow.400'}>
                  1. WALLET {user ? '✓' : 'REQUIRED'}
                </Text>
              </Box>
              <Box w="10px" h="2px" bg="#22c55e" mx={1} />
              <Box
                flex={1}
                p={2}
                bg={user?.twitterLinked ? '#05130a' : '#050a06'}
                border="1px solid"
                borderColor={user?.twitterLinked ? '#22c55e' : '#334155'}
                textAlign="center"
              >
                <Text
                  fontFamily="var(--font-pixel)"
                  fontSize="3xs"
                  color={user?.twitterLinked ? 'green.400' : 'gray.400'}
                >
                  2. TWITTER {user?.twitterLinked ? '✓' : ''}
                </Text>
              </Box>
              <Box w="10px" h="2px" bg="#22c55e" mx={1} />
              <Box
                flex={1}
                p={2}
                bg={user?.referredBy ? '#05130a' : '#050a06'}
                border="1px solid"
                borderColor={user?.referredBy ? '#22c55e' : '#334155'}
                textAlign="center"
              >
                <Text
                  fontFamily="var(--font-pixel)"
                  fontSize="3xs"
                  color={user?.referredBy ? 'green.400' : 'gray.400'}
                >
                  3. INVITE {user?.referredBy ? '✓' : ''}
                </Text>
              </Box>
            </Flex>

            {/* Step 1: Wallet Connect */}
            {!user ? (
              <VStack
                p={5}
                bg="#030805"
                border="1px solid #166534"
                align="center"
                gap={4}
                textAlign="center"
              >
                <Text fontSize="2xl">🛡️</Text>
                <VStack gap={1}>
                  <Text fontFamily="var(--font-retro)" fontSize="xl" color="white">
                    LINK CRYPTOGRAPHIC WALLET
                  </Text>
                  <Text fontFamily="var(--font-mono)" fontSize="xs" color="gray.400">
                    Connect via SIWE to establish identity on the Whitelist Flywheel.
                  </Text>
                </VStack>
                <Button
                  w="full"
                  bg="#22c55e"
                  color="black"
                  fontFamily="var(--font-pixel)"
                  fontSize="2xs"
                  py={6}
                  _hover={{ bg: '#4ade80', boxShadow: '0 0 15px rgba(74, 222, 128, 0.6)' }}
                  onClick={onConnectWallet}
                >
                  CONNECT WALLET
                </Button>
              </VStack>
            ) : !user.twitterLinked ? (
              /* Step 2: Link Twitter */
              <VStack
                p={5}
                bg="#030805"
                border="1px solid #166534"
                align="stretch"
                gap={4}
                textAlign="center"
              >
                <VStack gap={1}>
                  <Text fontSize="2xl">🐦</Text>
                  <Text fontFamily="var(--font-retro)" fontSize="xl" color="white">
                    CONNECT SOCIAL IDENTITY
                  </Text>
                  <Text fontFamily="var(--font-mono)" fontSize="xs" color="gray.400">
                    Link your Twitter profile to unlock tasks and earn +10 starting coins.
                  </Text>
                </VStack>
                <VStack gap={3}>
                  <Input
                    placeholder="@username"
                    value={twitterUsername}
                    onChange={(e) => setTwitterUsername(e.target.value)}
                    bg="#05130a"
                    border="1px solid #1da1f2"
                    color="white"
                    fontFamily="var(--font-mono)"
                    textAlign="center"
                    fontSize="md"
                    _placeholder={{ color: 'gray.600', fontSize: 'xs' }}
                  />
                  <Button
                    w="full"
                    bg="#1da1f2"
                    color="white"
                    fontFamily="var(--font-pixel)"
                    fontSize="2xs"
                    py={6}
                    _hover={{ bg: '#40a9f3', boxShadow: '0 0 15px rgba(29, 161, 242, 0.6)' }}
                    onClick={async () => {
                      if (!twitterUsername.trim()) {
                        toast({ title: 'Please enter your Twitter username', status: 'warning' });
                        return;
                      }
                      const success = await onLinkTwitter(twitterUsername.trim());
                      if (success) {
                        setActiveStep(3);
                      }
                    }}
                  >
                    LINK TWITTER (+10 COINS)
                  </Button>
                </VStack>
                <Button
                  variant="ghost"
                  size="sm"
                  color="gray.400"
                  fontFamily="var(--font-pixel)"
                  fontSize="3xs"
                  onClick={() => setActiveStep(3)}
                >
                  SKIP FOR NOW →
                </Button>
              </VStack>
            ) : (
              /* Step 3: Referral Code */
              <VStack
                p={5}
                bg="#030805"
                border="1px solid #166534"
                align="stretch"
                gap={4}
              >
                <VStack gap={1} align="center" textAlign="center">
                  <Text fontSize="2xl">🎁</Text>
                  <Text fontFamily="var(--font-retro)" fontSize="xl" color="white">
                    INVITATION REFERRAL
                  </Text>
                  <Text fontFamily="var(--font-mono)" fontSize="xs" color="gray.400">
                    Enter an invitation referral code to claim +15 COINS welcome bonus.
                  </Text>
                </VStack>

                {!user.referredBy ? (
                  <VStack gap={3}>
                    <Input
                      placeholder="ENTER CODE (e.g. BLNK-E4F1B3)"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      bg="#05130a"
                      border="1px solid #22c55e"
                      color="green.200"
                      fontFamily="var(--font-mono)"
                      textAlign="center"
                      fontSize="md"
                      letterSpacing="3px"
                      _placeholder={{ color: 'gray.600', letterSpacing: 'normal', fontSize: 'xs' }}
                    />
                    <HStack w="full" gap={3}>
                      <Button
                        flex={1}
                        bg="#22c55e"
                        color="black"
                        fontFamily="var(--font-pixel)"
                        fontSize="3xs"
                        isLoading={isClaiming}
                        onClick={handleClaimReferral}
                        _hover={{ bg: '#4ade80' }}
                      >
                        CLAIM (+15 COINS)
                      </Button>
                      <Button
                        flex={1}
                        bg="transparent"
                        border="1px solid #22c55e"
                        color="green.400"
                        fontFamily="var(--font-pixel)"
                        fontSize="3xs"
                        onClick={onClose}
                        _hover={{ bg: '#14532d' }}
                      >
                        ENTER FLYWHEEL →
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  <VStack gap={3} align="center">
                    <Text fontFamily="var(--font-pixel)" fontSize="2xs" color="green.400">
                      ✓ REFERRAL APPLIED ({user.referredBy})
                    </Text>
                    <Button
                      w="full"
                      bg="#22c55e"
                      color="black"
                      fontFamily="var(--font-pixel)"
                      fontSize="2xs"
                      py={6}
                      _hover={{ bg: '#4ade80', boxShadow: '0 0 15px rgba(74, 222, 128, 0.6)' }}
                      onClick={onClose}
                    >
                      ENTER THE CLAW MACHINE →
                    </Button>
                  </VStack>
                )}
              </VStack>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
