'use client';

import { Box, Modal, ModalContent, ModalOverlay, useToast, Text, Button, VStack } from '@chakra-ui/react';
import { Canvas } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import ButtonsControl from '@/components/ButtonsControl';
import JoystickControl from '@/components/JoystickControl';
import ProgressBar from '@/components/ProgressBar';
import Scene from '@/components/Scene';
import PrizeCapsule from '@/components/PrizeCapsule';
import { useRouter } from 'next/navigation';

export default function GamePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [colorFlood, setColorFlood] = useState(false);
  const [lootCard, setLootCard] = useState<any>(null);
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
        ref.current?.onPick(data.outcome); // pass outcome to scene if needed
        
        // Simulating the drop animation time before revealing the outcome
        setTimeout(() => {
          if (data.outcome !== 'LOSS') {
            setColorFlood(true);
            setTimeout(() => {
              setLootCard(data.outcome);
            }, 1000); // 1 second after color flood, show card
          } else {
            toast({ title: 'Better luck next time!', status: 'info' });
          }
        }, 5000); // adjust based on actual animation duration
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
    <Box position='relative' w='100vw' h='100vh' overflow="hidden" bg="black" transition="background 1s ease" style={{ backgroundColor: colorFlood ? 'white' : 'black' }}>
      
      {/* Color Flood Overlay */}
      <Box 
        position="absolute" 
        inset={0} 
        bgGradient="linear(to-tr, cyan.400, purple.500, pink.500, yellow.400)" 
        opacity={colorFlood ? 1 : 0} 
        transition="opacity 1s ease-in-out" 
        zIndex={1} 
        pointerEvents="none"
        mixBlendMode="screen"
      />

      {/* Interactive 3D Prize Capsule Reveal */}
      {lootCard && (
        <PrizeCapsule
          outcome={lootCard}
          onClose={() => {
            setLootCard(null);
            setColorFlood(false);
          }}
          onShare={shareOnX}
        />
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

      <Canvas shadows='soft' camera={{ position: [0, 2.1, 2.2], fov: 55 }}>
        <Scene ref={ref} setIsLoading={setIsLoading} setProgress={setProgress} />
      </Canvas>
    </Box>
  );
}
