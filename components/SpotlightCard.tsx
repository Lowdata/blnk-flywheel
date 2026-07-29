'use client';

import { ReactNode, useRef, useState, MouseEvent } from 'react';
import { Box, BoxProps } from '@chakra-ui/react';

interface SpotlightCardProps extends BoxProps {
  children: ReactNode;
  spotlightColor?: string;
}

export default function SpotlightCard({
  children,
  spotlightColor = 'rgba(74, 222, 128, 0.35)',
  ...rest
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <Box
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      position="relative"
      overflow="hidden"
      rounded="none"
      bg="#0b1810"
      border="3px solid"
      borderColor="#166534"
      transition="border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease"
      _hover={{
        borderColor: '#22c55e',
        transform: 'translateY(-3px)',
        boxShadow: '0 8px 0 #050a06, 0 12px 25px rgba(34, 197, 94, 0.25)',
      }}
      {...rest}
    >
      {/* Dynamic Retro Phosphor CRT Spotlight Glow Overlay with Higher Intensity */}
      <Box
        pointerEvents="none"
        position="absolute"
        inset={0}
        opacity={opacity}
        transition="opacity 0.25s ease"
        style={{
          background: `radial-gradient(420px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      <Box position="relative" zIndex={2}>
        {children}
      </Box>
    </Box>
  );
}
