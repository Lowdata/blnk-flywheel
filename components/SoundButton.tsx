'use client';

import { useState, useEffect } from 'react';
import { Button } from '@chakra-ui/react';
import { soundManager } from '@/lib/sound';

export default function SoundButton() {
  const [muted, setMuted] = useState<boolean>(false);

  useEffect(() => {
    setMuted(soundManager.isMuted());
    const unsubscribe = soundManager.subscribe((isMuted) => {
      setMuted(isMuted);
    });
    return () => unsubscribe();
  }, []);

  const handleToggle = () => {
    const next = soundManager.toggleMute();
    setMuted(next);
    if (!next) {
      soundManager.playClick();
    }
  };

  return (
    <Button
      onClick={handleToggle}
      size="sm"
      rounded="full"
      bg="rgba(15, 15, 18, 0.85)"
      color="#ffffff"
      border="1px solid"
      borderColor="rgba(255, 255, 255, 0.2)"
      backdropFilter="blur(12px)"
      fontFamily="var(--font-pixel)"
      fontSize="9px"
      letterSpacing="0.1em"
      _hover={{
        bg: 'rgba(25, 25, 30, 0.95)',
        borderColor: '#edc75b',
        color: '#edc75b',
        transform: 'translateY(-1px)',
        boxShadow: '0 4px 15px rgba(0,0,0,0.6)',
      }}
      _active={{ transform: 'translateY(1px)' }}
      px={4}
      py={2.5}
      boxShadow="0 4px 12px rgba(0,0,0,0.5)"
      aria-label={muted ? 'Unmute Sound' : 'Mute Sound'}
    >
      {muted ? '🔇 MUTED' : '🔊 SOUND ON'}
    </Button>
  );
}
