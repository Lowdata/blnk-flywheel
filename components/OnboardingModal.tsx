'use client';

import React, { useState, useEffect } from 'react';
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

// Wallet brand badges shown in step 1
const WALLET_BADGES = [
  { name: 'MetaMask' },
  { name: 'Phantom' },
  { name: 'Rainbow' },
  { name: 'Trust' },
];

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
  // Always start at 1; the effect below drives step from user state.
  const [activeStep, setActiveStep] = useState<number>(1);
  const toast = useToast();

  // Drive activeStep from user state whenever the modal opens or user changes.
  useEffect(() => {
    if (!isOpen) return;
    if (!user) {
      setActiveStep(1);
    } else if (!user.twitterLinked) {
      // Only advance 1→2; if already on step 3, don't regress
      setActiveStep((prev) => (prev < 2 ? 2 : prev));
    } else {
      // user fully onboarded — close if we just completed step 1 or 2
      setActiveStep((prev) => {
        if (prev === 1 || prev === 2) {
          // Advance to referral step
          return 3;
        }
        return prev;
      });
    }
  }, [isOpen, user]);

  // When a fully-onboarded user re-opens the modal, close it immediately.
  useEffect(() => {
    if (isOpen && user?.twitterLinked && activeStep === 3 && user?.referredBy) {
      onClose();
    }
  }, [isOpen, user, activeStep, onClose]);

  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const saved = localStorage.getItem('blnk_ref_code');
      if (saved && !referralInput) {
        setReferralInput(saved);
      }
    }
  }, [isOpen]);

  const handleClaimReferral = async () => {
    if (!referralInput.trim()) {
      onClose();
      return;
    }
    setIsClaiming(true);
    try {
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: referralInput.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        if (typeof window !== 'undefined') localStorage.removeItem('blnk_ref_code');
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg" closeOnOverlayClick={false} closeOnEsc={false}>
      <ModalOverlay bg="rgba(0, 0, 0, 0.88)" backdropFilter="blur(10px)" />
      <ModalContent
        bg="#050a05"
        border="1px solid"
        borderColor="whiteAlpha.200"
        boxShadow="0 0 40px rgba(0, 0, 0, 0.9), inset 0 0 15px rgba(255, 255, 255, 0.04)"
        borderRadius="3xl"
        p={6}
        color="white"
        position="relative"
        overflow="hidden"
      >
        {/* Monochrome top accent line */}
        <Box
          position="absolute"
          top="-1px"
          left="20%"
          right="20%"
          height="2px"
          bg="whiteAlpha.400"
          boxShadow="0 0 12px rgba(255, 255, 255, 0.3)"
        />

        <ModalBody p={0}>
          <VStack align="stretch" gap={6}>
            <VStack align="center" gap={1}>
              <Text
                fontWeight="semibold"
                fontSize="2xs"
                color="whiteAlpha.500"
                letterSpacing="2px"
                textAlign="center"
              >
                WELCOME TO BLNK
              </Text>
              <Text
                fontWeight="black"
                fontSize="2xl"
                color="white"
                textAlign="center"
                letterSpacing="tight"
              >
                LET'S GET STARTED
              </Text>
            </VStack>

            {/* Stepper HUD */}
            <Flex justify="space-between" align="center" px={2}>
              <Box
                flex={1}
                p={2}
                bg={user ? '#081108' : '#0c180c'}
                border="1px solid"
                borderColor={user ? 'whiteAlpha.400' : 'whiteAlpha.200'}
                borderRadius="lg"
                textAlign="center"
              >
                <Text fontWeight="medium" fontSize="3xs" color={user ? '#CCFF00' : 'whiteAlpha.800'}>
                  1. WALLET {user ? '✓' : 'REQUIRED'}
                </Text>
              </Box>
              <Box w="10px" h="1px" bg="whiteAlpha.200" mx={1} />
              <Box
                flex={1}
                p={2}
                bg={user?.twitterLinked ? '#081108' : '#050a05'}
                border="1px solid"
                borderColor={user?.twitterLinked ? 'whiteAlpha.400' : 'whiteAlpha.100'}
                borderRadius="lg"
                textAlign="center"
              >
                <Text
                  fontWeight="medium"
                  fontSize="3xs"
                  color={user?.twitterLinked ? '#CCFF00' : 'whiteAlpha.400'}
                >
                  2. TWITTER {user?.twitterLinked ? '✓' : ''}
                </Text>
              </Box>
              <Box w="10px" h="1px" bg="whiteAlpha.200" mx={1} />
              <Box
                flex={1}
                p={2}
                bg={user?.referredBy ? '#081108' : '#050a05'}
                border="1px solid"
                borderColor={user?.referredBy ? 'whiteAlpha.400' : 'whiteAlpha.100'}
                borderRadius="lg"
                textAlign="center"
              >
                <Text
                  fontWeight="medium"
                  fontSize="3xs"
                  color={user?.referredBy ? '#CCFF00' : 'whiteAlpha.400'}
                >
                  3. INVITE {user?.referredBy ? '✓' : ''}
                </Text>
              </Box>
            </Flex>

            {/* --- Step 1: Wallet Connect --- */}
            {activeStep === 1 && (
              <VStack
                p={5}
                bg="#071207"
                border="1px solid"
                borderColor="whiteAlpha.200"
                borderRadius="2xl"
                align="center"
                gap={4}
                textAlign="center"
              >
                <Icon viewBox="0 0 24 24" boxSize={8} color="whiteAlpha.800" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Icon>
                <VStack gap={1}>
                  <Text fontWeight="bold" fontSize="lg" color="white">
                    CONNECT WALLET
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">
                    Connect your wallet to create your account and start playing.
                  </Text>
                </VStack>

                {/* Monochrome wallet brand badges */}
                <HStack gap={2} wrap="wrap" justify="center">
                  {WALLET_BADGES.map((w) => (
                    <Flex
                      key={w.name}
                      align="center"
                      gap={1.5}
                      px={2.5}
                      py={1}
                      bg="whiteAlpha.50"
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      borderRadius="md"
                    >
                      <Box
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        bg="whiteAlpha.600"
                      />
                      <Text fontSize="2xs" color="whiteAlpha.800" fontWeight="medium">
                        {w.name}
                      </Text>
                    </Flex>
                  ))}
                </HStack>

                <Button
                  w="full"
                  bg="#CCFF00"
                  color="black"
                  fontWeight="bold"
                  fontSize="xs"
                  py={6}
                  rounded="xl"
                  _hover={{ bg: '#CCFF00', transform: 'translateY(-1px)', boxShadow: '0 0 15px rgba(72,187,120,0.4)' }}
                  onClick={onConnectWallet}
                >
                  CONNECT WALLET
                </Button>
              </VStack>
            )}

            {/* --- Step 2: Link Twitter --- */}
            {activeStep === 2 && (
              <VStack
                p={5}
                bg="#071207"
                border="1px solid"
                borderColor="whiteAlpha.200"
                borderRadius="2xl"
                align="stretch"
                gap={4}
              >
                <VStack gap={1} align="center" textAlign="center">
                  <Icon viewBox="0 0 24 24" boxSize={8} color="whiteAlpha.900" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </Icon>
                  <Text fontWeight="bold" fontSize="lg" color="white">
                    LINK X (TWITTER)
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">
                    Connect your X account to claim your +10 COINS bonus.
                  </Text>
                </VStack>

                <VStack gap={3}>
                  <Input
                    placeholder="ENTER @USERNAME"
                    value={twitterUsername}
                    onChange={(e) => setTwitterUsername(e.target.value)}
                    bg="#050a05"
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    color="white"
                    textAlign="center"
                    fontSize="sm"
                    rounded="xl"
                    _placeholder={{ color: 'whiteAlpha.400', fontSize: 'xs' }}
                    _focus={{ borderColor: 'whiteAlpha.600', boxShadow: 'none' }}
                  />
                  <Button
                    w="full"
                    bg="#CCFF00"
                    color="black"
                    fontWeight="bold"
                    fontSize="xs"
                    py={6}
                    rounded="xl"
                    _hover={{ bg: '#CCFF00', transform: 'translateY(-1px)', boxShadow: '0 0 15px rgba(72,187,120,0.4)' }}
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
                    LINK X (+10 COINS)
                  </Button>
                </VStack>
              </VStack>
            )}

            {/* --- Step 3: Referral Code --- */}
            {activeStep === 3 && (
              <VStack
                p={5}
                bg="#071207"
                border="1px solid"
                borderColor="whiteAlpha.200"
                borderRadius="2xl"
                align="stretch"
                gap={4}
              >
                <VStack gap={1} align="center" textAlign="center">
                  <Icon viewBox="0 0 24 24" boxSize={8} color="whiteAlpha.800" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </Icon>
                  <Text fontWeight="bold" fontSize="lg" color="white">
                    REFERRAL CODE
                  </Text>
                  <Text color="whiteAlpha.600" fontSize="xs">
                    Got a referral code? Enter it below for a +15 COINS bonus.
                  </Text>
                </VStack>

                {!user?.referredBy ? (
                  <VStack gap={3}>
                    <Input
                      placeholder="ENTER CODE (e.g. BLNK-E4F1B3)"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      bg="#050a05"
                      border="1px solid"
                      borderColor="whiteAlpha.300"
                      color="white"
                      textAlign="center"
                      fontSize="sm"
                      rounded="xl"
                      letterSpacing="2px"
                      _placeholder={{ color: 'whiteAlpha.400', letterSpacing: 'normal', fontSize: 'xs' }}
                      _focus={{ borderColor: 'whiteAlpha.600', boxShadow: 'none' }}
                    />
                    <Button
                      w="full"
                      bg="#CCFF00"
                      color="black"
                      fontWeight="bold"
                      fontSize="xs"
                      py={6}
                      rounded="xl"
                      _hover={{ bg: '#CCFF00', transform: 'translateY(-1px)', boxShadow: '0 0 15px rgba(72,187,120,0.4)' }}
                      onClick={handleClaimReferral}
                      isLoading={isClaiming}
                    >
                      {referralInput.trim() ? 'CLAIM & PLAY (+15 COINS)' : 'SKIP & PLAY'}
                    </Button>
                  </VStack>
                ) : (
                  <VStack gap={3} align="center">
                    <Text fontWeight="medium" fontSize="xs" color="#CCFF00">
                      ✓ REFERRAL APPLIED ({user.referredBy})
                    </Text>
                    <Button
                      w="full"
                      bg="#CCFF00"
                      color="black"
                      fontWeight="bold"
                      fontSize="xs"
                      py={6}
                      rounded="xl"
                      _hover={{ bg: '#CCFF00', transform: 'translateY(-1px)', boxShadow: '0 0 15px rgba(72,187,120,0.4)' }}
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
