'use client';

import { Box, Modal, ModalContent, ModalOverlay, useToast, Text, Button, VStack } from '@chakra-ui/react';
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
  const [colorFlood, setColorFlood] = useState(false);
  const [lootCard, setLootCard] = useState<any>(null);
  const [revealStep, setRevealStep] = useState<string | null>(null);
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
        setUser({ ...user, coins: data.coinsLeft });
        ref.current?.onPick(data.outcome);
        
        // Wait 4.5 seconds for the physical claw drop animation into the chute
        setTimeout(() => {
          if (data.outcome !== 'LOSS') {
            setColorFlood(true);
            // Trigger seamless in-scene reveal on the exact caught physics object
            ref.current?.startReveal(
              data.outcome,
              () => {
                // onReady callback: capsule centered in view and ready to open
                setRevealStep('ready');
              },
              () => {
                // onComplete callback: 2 seconds after lid lift animation completes
                setRevealStep('opened');
                setLootCard(data.outcome);
              }
            );
          } else {
            toast({ title: 'Better luck next time!', status: 'info' });
          }
        }, 4500);
      } else {
        toast({ title: data.message, status: 'error' });
      }
    } catch (e) {
      toast({ title: 'Error playing', status: 'error' });
    }
  };

  const shareOnX = () => {
    const text = encodeURIComponent(`I just won a ${lootCard} whitelist spot for BLNK! The world is getting its color back. 🎨✨\n\n@BLNK_nft`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  if (!mounted) {
    return (
      <Box position='relative' w='100vw' h='100vh' overflow="hidden" bg="black" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize="xl" color="whiteAlpha.700" fontWeight="medium" letterSpacing="widest">
          LOADING GAME...
        </Text>
      </Box>
    );
  }

  return (
    <Box position='relative' w='100vw' h='100vh' overflow="hidden" bg="black" transition="background 1s ease" style={{ backgroundColor: colorFlood ? '#0a0e17' : 'black' }}>
      
      {/* Color Flood / Backdrop Dimming Overlay during reveal */}
      <Box 
        position="absolute" 
        inset={0} 
        bgGradient="radial(circle at center, rgba(0, 255, 255, 0.15), rgba(0, 0, 0, 0.85))" 
        opacity={colorFlood ? 1 : 0} 
        transition="opacity 1.5s ease-in-out" 
        zIndex={1} 
        pointerEvents="none"
      />

      {/* Interactive Click Overlay when capsule is ready to open */}
      {revealStep === 'ready' && (
        <>
          <Box
            position="absolute"
            top="15%"
            width="100%"
            textAlign="center"
            zIndex={20}
            pointerEvents="none"
          >
            <Text fontSize="2xl" fontWeight="black" color="cyan.300" letterSpacing="0.2em" textShadow="0 0 20px rgba(0,255,255,0.8)">
              ✨ CLICK CAPSULE TO OPEN ✨
            </Text>
          </Box>
          <Box
            position="absolute"
            inset={0}
            zIndex={15}
            cursor="pointer"
            onClick={() => {
              setRevealStep('opening');
              ref.current?.clickCapsule();
            }}
          />
        </>
      )}

      {/* Apple-like UI CTA Modal (appears only AFTER animation finishes) */}
      {lootCard && (
        <Box
          position="absolute"
          inset={0}
          zIndex={30}
          bg="blackAlpha.800"
          backdropFilter="blur(16px)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={6}
        >
          <VStack spacing={6} bg="whiteAlpha.100" p={8} rounded="2xl" border="1px solid" borderColor="whiteAlpha.300" maxW="md" w="full" textAlign="center" boxShadow="0 0 50px rgba(0, 255, 255, 0.2)">
            <Text fontSize="xs" fontWeight="bold" color="cyan.400" letterSpacing="widest">
              REWARD UNLOCKED
            </Text>
            <Text fontSize="3xl" fontWeight="black" color="white" textTransform="uppercase" letterSpacing="wider">
              {lootCard}
            </Text>
            <Text fontSize="sm" color="whiteAlpha.800">
              You have successfully extracted a rare whitelist spot from the machine.
            </Text>
            <Button
              w="full"
              size="lg"
              bg="#1DA1F2"
              color="white"
              _hover={{ bg: '#1a91da', transform: 'translateY(-2px)', boxShadow: '0 5px 15px rgba(29, 161, 242, 0.4)' }}
              onClick={shareOnX}
              rounded="xl"
              fontWeight="bold"
            >
              Share on X to Claim
            </Button>
            <Button
              w="full"
              variant="ghost"
              color="whiteAlpha.700"
              _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
              onClick={() => {
                setLootCard(null);
                setRevealStep(null);
                setColorFlood(false);
                ref.current?.closeReveal();
              }}
            >
              Close & Return to Machine
            </Button>
          </VStack>
        </Box>
      )}

      {/* Loading Modal */}
      <Modal isOpen={isLoading} onClose={() => { }}>
        <ModalOverlay bg='black' />
        <ModalContent my={0} py='120px' h='full' display='flex' justifyContent='end' alignItems='center' bg='none' shadow='none'>
          <ProgressBar progress={progress} />
        </ModalContent>
      </Modal>

      {/* Game UI Controls */}
      <Box position="absolute" top={4} left={4} zIndex={10} bg="blackAlpha.800" color="white" p={4} rounded="md" border="2px solid white">
        <Text fontWeight="bold" letterSpacing="widest">COINS: {user?.coins || 0}</Text>
      </Box>

      <JoystickControl onJoystick={(x: any, z: any) => ref.current?.onJoystick(x, z)} />
      <ButtonsControl onStart={() => {}} onPick={handlePick} />

      <Canvas shadows camera={{ position: [0, 2.1, 2.2], fov: 55 }}>
        <Scene ref={ref} setIsLoading={setIsLoading} setProgress={setProgress} />
      </Canvas>
    </Box>
  );
}
