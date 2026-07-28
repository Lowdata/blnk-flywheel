'use client';

import { Box, Modal, ModalContent, ModalOverlay, useToast, Text, Button, VStack, HStack } from '@chakra-ui/react';
import { Canvas } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import ButtonsControl from '@/components/ButtonsControl';
import JoystickControl from '@/components/JoystickControl';
import ProgressBar from '@/components/ProgressBar';
import Scene from '@/components/Scene';
import { useRouter } from 'next/navigation';

export default function GamePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [revealStep, setRevealStep] = useState<string | null>(null);
  const [outcomeCard, setOutcomeCard] = useState<{ outcome: string; isWin: boolean } | null>(null);
  const [user, setUser] = useState<any>(null);

  const ref = useRef<any>(null);
  const toast = useToast();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) {
          res.json().then(data => setUser(data.user));
        } else {
          toast({ title: 'Please connect wallet', status: 'warning' });
          router.push('/');
        }
      })
      .catch(() => {
        toast({ title: 'Network error. Please reconnect.', status: 'error' });
        router.push('/');
      });
  }, [router, toast]);

  const handlePick = async () => {
    try {
      const res = await fetch('/api/game/play', { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        setUser((prev: any) => ({ ...prev, coins: data.coinsLeft }));
        ref.current?.onPick(data.outcome);

        // Wait for the physical claw animation to complete before reveal
        setTimeout(() => {
          const isWin = data.outcome !== 'LOSS';
          ref.current?.startReveal(
            data.outcome,
            () => setRevealStep('ready'),
            () => {
              setRevealStep('opened');
              setOutcomeCard({ outcome: data.outcome, isWin });
            }
          );
        }, 4500);
      } else {
        toast({ title: data.message, status: 'error' });
      }
    } catch {
      toast({ title: 'Error playing', status: 'error' });
    }
  };

  const shareOnX = () => {
    const text = encodeURIComponent(
      `I just won a ${outcomeCard?.outcome} whitelist spot for BLNK! The world is getting its color back. 🎨✨\n\n@BLNK_nft`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleClose = () => {
    setOutcomeCard(null);
    setRevealStep(null);
    ref.current?.closeReveal();
  };

  if (!mounted) {
    return (
      <Box
        position="relative" w="100vw" h="100vh" overflow="hidden"
        bg="#0d0d0d" display="flex" alignItems="center" justifyContent="center"
      >
        <Text fontSize="xl" color="whiteAlpha.500" fontWeight="medium" letterSpacing="widest">
          LOADING…
        </Text>
      </Box>
    );
  }

  return (
    <Box position="relative" w="100vw" h="100vh" overflow="hidden" bg="#0d0d0d">

      {/* Subtle vignette — pure monochrome */}
      <Box
        position="absolute" inset={0} pointerEvents="none" zIndex={1}
        bgGradient="radial(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)"
      />

      {/* CLICK TO OPEN prompt */}
      {revealStep === 'ready' && (
        <>
          <Box
            position="absolute" top="12%" width="100%" textAlign="center"
            zIndex={20} pointerEvents="none"
          >
            <Text
              fontSize={{ base: 'lg', md: '2xl' }} fontWeight="black"
              color="whiteAlpha.900" letterSpacing="0.25em"
              textShadow="0 0 30px rgba(255,255,255,0.4)"
            >
              ✦ CLICK TO OPEN ✦
            </Text>
          </Box>
          <Box
            position="absolute" inset={0} zIndex={15} cursor="pointer"
            onClick={() => {
              setRevealStep('opening');
              ref.current?.clickCapsule();
            }}
          />
        </>
      )}

      {/* Outcome Modal */}
      {outcomeCard && (
        <Box
          position="absolute" inset={0} zIndex={30}
          bg="rgba(0,0,0,0.88)" backdropFilter="blur(20px)"
          display="flex" alignItems="center" justifyContent="center" p={6}
        >
          <VStack
            spacing={6}
            bg="rgba(255,255,255,0.04)"
            p={8} rounded="2xl"
            border="1px solid rgba(255,255,255,0.1)"
            maxW="400px" w="full" textAlign="center"
            boxShadow="0 0 60px rgba(255,255,255,0.06)"
          >
            {outcomeCard.isWin ? (
              <>
                <Text fontSize="xs" fontWeight="bold" color="whiteAlpha.500" letterSpacing="widest">
                  REWARD UNLOCKED
                </Text>
                <Text
                  fontSize="3xl" fontWeight="black" color="white"
                  textTransform="uppercase" letterSpacing="wider"
                >
                  {outcomeCard.outcome}
                </Text>
                <Text fontSize="sm" color="whiteAlpha.600" lineHeight="tall">
                  You have extracted a rare whitelist spot from the machine.
                </Text>
                <Button
                  w="full" size="lg" bg="white" color="black"
                  _hover={{ bg: 'whiteAlpha.800', transform: 'translateY(-2px)' }}
                  onClick={shareOnX} rounded="xl" fontWeight="bold"
                >
                  Share on X to Claim
                </Button>
                <Button
                  w="full" variant="ghost" size="sm"
                  color="whiteAlpha.500" _hover={{ color: 'white' }}
                  onClick={handleClose}
                >
                  Close & return to machine
                </Button>
              </>
            ) : (
              <>
                <Text fontSize="xs" fontWeight="bold" color="whiteAlpha.500" letterSpacing="widest">
                  THE CLAW HAS SPOKEN
                </Text>
                <Text
                  fontSize="3xl" fontWeight="black" color="whiteAlpha.800"
                  textTransform="uppercase" letterSpacing="wider"
                >
                  EMPTY
                </Text>
                <Text fontSize="sm" color="whiteAlpha.500" lineHeight="tall">
                  The capsule was empty this time.{'\n'}
                  The world remains grey a little longer.
                </Text>
                <Button
                  w="full" size="lg" bg="white" color="black"
                  _hover={{ bg: 'whiteAlpha.800' }}
                  onClick={handleClose} rounded="xl" fontWeight="bold"
                >
                  Try Again
                </Button>
              </>
            )}
          </VStack>
        </Box>
      )}

      {/* Loading overlay */}
      <Modal isOpen={isLoading} onClose={() => {}}>
        <ModalOverlay bg="black" />
        <ModalContent my={0} py="120px" h="full" display="flex" justifyContent="end" alignItems="center" bg="none" shadow="none">
          <ProgressBar progress={progress} />
        </ModalContent>
      </Modal>

      {/* HUD */}
      <Box
        position="absolute" top={4} left={4} zIndex={10}
        bg="rgba(0,0,0,0.7)" backdropFilter="blur(8px)"
        color="whiteAlpha.900" px={4} py={3} rounded="lg"
        border="1px solid rgba(255,255,255,0.1)"
      >
        <Text fontWeight="bold" letterSpacing="widest" fontSize="sm">
          COINS: {user?.coins ?? 0}
        </Text>
      </Box>

      <JoystickControl onJoystick={(x: any, z: any) => ref.current?.onJoystick(x, z)} />
      <ButtonsControl onStart={() => {}} onPick={handlePick} />

      <Canvas shadows camera={{ position: [0, 2.1, 2.2], fov: 55 }}>
        <Scene ref={ref} setIsLoading={setIsLoading} setProgress={setProgress} />
      </Canvas>
    </Box>
  );
}
