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

  useEffect(() => {
    if (isOpen) {
      if (!user) setActiveStep(1);
      else if (!user.twitterLinked) setActiveStep(2);
      else setActiveStep(3);
    }
  }, [isOpen, user]);

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
      <ModalOverlay bg="rgba(0, 0, 0, 0.88)" backdropFilter="blur(8px)" />
      <ModalContent
        bg="#0e0514"
        border="2px solid #d946ef"
        boxShadow="0 0 35px rgba(236, 72, 153, 0.35), inset 0 0 15px rgba(236, 72, 153, 0.15)"
        borderRadius="3xl"
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
          bg="#f472b6"
          boxShadow="0 0 12px #f472b6"
        />

        <ModalBody p={0}>
          <VStack align="stretch" gap={6}>
            <VStack align="center" gap={1}>
              <Text
                fontWeight="medium"
                fontSize="xs"
                color="pink.400"
                letterSpacing="2px"
                textAlign="center"
              >
                SYSTEM ACCESS REQUIRED
              </Text>
              <Text
                fontWeight="bold"
                fontSize="3xl"
                color="white"
                textAlign="center"
                textShadow="0 0 10px rgba(244, 114, 182, 0.4)"
              >
                ONBOARDING PROTOCOL
              </Text>
            </VStack>

            {/* Stepper HUD */}
            <Flex justify="space-between" align="center" px={2}>
              <Box
                flex={1}
                p={2}
                bg={user ? '#0e0514' : '#1c082a'}
                border="1px solid"
                borderColor={user ? '#d946ef' : '#a855f7'}
                textAlign="center"
              >
                <Text fontWeight="medium" fontSize="3xs" color={user ? 'green.400' : 'yellow.400'}>
                  1. WALLET {user ? '✓' : 'REQUIRED'}
                </Text>
              </Box>
              <Box w="10px" h="2px" bg="#d946ef" mx={1} />
              <Box
                flex={1}
                p={2}
                bg={user?.twitterLinked ? '#0e0514' : '#08030d'}
                border="1px solid"
                borderColor={user?.twitterLinked ? '#d946ef' : '#334155'}
                textAlign="center"
              >
                <Text
                  fontWeight="medium"
                  fontSize="3xs"
                  color={user?.twitterLinked ? 'green.400' : 'gray.400'}
                >
                  2. TWITTER {user?.twitterLinked ? '✓' : ''}
                </Text>
              </Box>
              <Box w="10px" h="2px" bg="#d946ef" mx={1} />
              <Box
                flex={1}
                p={2}
                bg={user?.referredBy ? '#0e0514' : '#08030d'}
                border="1px solid"
                borderColor={user?.referredBy ? '#d946ef' : '#334155'}
                textAlign="center"
              >
                <Text
                  fontWeight="medium"
                  fontSize="3xs"
                  color={user?.referredBy ? 'green.400' : 'gray.400'}
                >
                  3. INVITE {user?.referredBy ? '✓' : ''}
                </Text>
              </Box>
            </Flex>

            {/* Step 1: Wallet Connect */}
            {activeStep === 1 && (
              <VStack
                p={5}
                bg="#060308"
                border="1px solid #701a75"
                align="center"
                gap={4}
                textAlign="center"
              >
                <Icon viewBox="0 0 24 24" boxSize={8} color="pink.400" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </Icon>
                <VStack gap={1}>
                  <Text fontWeight="bold" fontSize="xl" color="white">
                    LINK CRYPTOGRAPHIC WALLET
                  </Text>
                  <Text color="gray.400" fontSize="xs">
                    Connect via SIWE to establish identity on the Whitelist Flywheel.
                  </Text>
                </VStack>
                <Button
                  w="full"
                  bg="#d946ef"
                  color="black"
                  fontWeight="medium"
                  fontSize="2xs"
                  py={6}
                  _hover={{ bg: '#f472b6', boxShadow: '0 0 15px rgba(244, 114, 182, 0.4)' }}
                  onClick={onConnectWallet}
                >
                  INITIALIZE SIWE CONNECTION
                </Button>
              </VStack>
            )}

            {activeStep === 2 && (
              /* Step 2: Link Twitter */
              <VStack
                p={5}
                bg="#060308"
                border="1px solid #701a75"
                align="stretch"
                gap={4}
              >
                <VStack gap={1} align="center" textAlign="center">
                  <Icon viewBox="0 0 24 24" boxSize={8} color="#1da1f2" fill="currentColor">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </Icon>
                  <Text fontWeight="bold" fontSize="xl" color="white">
                    LINK TWITTER
                  </Text>
                  <Text color="gray.400" fontSize="xs">
                    Connect your X (Twitter) account to enable social tasks and claim +10 COINS.
                  </Text>
                </VStack>
                
                <VStack gap={3}>
                  <Input
                    placeholder="ENTER @USERNAME"
                    value={twitterUsername}
                    onChange={(e) => setTwitterUsername(e.target.value)}
                    bg="#0e0514"
                    border="1px solid #1da1f2"
                    color="white"
                    textAlign="center"
                    fontSize="md"
                    _placeholder={{ color: 'gray.600', fontSize: 'xs' }}
                  />
                  <Button
                    w="full"
                    bg="#1da1f2"
                    color="white"
                    fontWeight="medium"
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
              </VStack>
            )}

            {activeStep === 3 && (
              /* Step 3: Referral Code */
              <VStack
                p={5}
                bg="#060308"
                border="1px solid #701a75"
                align="stretch"
                gap={4}
              >
                <VStack gap={1} align="center" textAlign="center">
                  <Icon viewBox="0 0 24 24" boxSize={8} color="purple.400" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </Icon>
                  <Text fontWeight="bold" fontSize="xl" color="white">
                    INVITATION REFERRAL
                  </Text>
                  <Text color="gray.400" fontSize="xs">
                    Enter an invitation referral code to claim +15 COINS welcome bonus.
                  </Text>
                </VStack>

                {!user.referredBy ? (
                  <VStack gap={3}>
                    <Input
                      placeholder="ENTER CODE (e.g. BLNK-E4F1B3)"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                      bg="#0e0514"
                      border="1px solid #d946ef"
                      color="pink.200"
                      textAlign="center"
                      fontSize="md"
                      letterSpacing="3px"
                      _placeholder={{ color: 'gray.600', letterSpacing: 'normal', fontSize: 'xs' }}
                    />
                    <Button
                      w="full"
                      bg="#d946ef"
                      color="black"
                      fontWeight="medium"
                      fontSize="2xs"
                      py={6}
                      isLoading={isClaiming}
                      onClick={handleClaimReferral}
                      _hover={{ bg: '#f472b6' }}
                    >
                      {referralInput.trim() ? 'CLAIM & ENTER (+15 COINS)' : 'ENTER THE FLYWHEEL'}
                    </Button>
                  </VStack>
                ) : (
                  <VStack gap={3} align="center">
                    <Text fontWeight="medium" fontSize="2xs" color="pink.400">
                      ✓ REFERRAL APPLIED ({user.referredBy})
                    </Text>
                    <Button
                      w="full"
                      bg="#d946ef"
                      color="black"
                      fontWeight="medium"
                      fontSize="2xs"
                      py={6}
                      _hover={{ bg: '#f472b6', boxShadow: '0 0 15px rgba(74, 222, 128, 0.6)' }}
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
