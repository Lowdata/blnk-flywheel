'use client';

import { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { useMounted } from '@/hooks/useMounted';

export default function Spotlight() {
  const mounted = useMounted();
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // The 3D scene in /game already has its own grayscale logic and might look weird 
  // with a 2D DOM mask cutting through the canvas.
  // We disable the 2D spotlight mask on the /game page so it doesn't interfere.
  // We also disable it on the /marketplace route because it has its own standalone design.
  const isDisabledRoute = pathname === '/game' || pathname?.startsWith('/marketplace');

  useEffect(() => {
    if (!mounted || isDisabledRoute) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (overlayRef.current) {
        const x = e.clientX;
        const y = e.clientY;
        const mask = `radial-gradient(circle 290px at ${x}px ${y}px, transparent 0%, rgba(0,0,0,1) 100%)`;
        overlayRef.current.style.maskImage = mask;
        overlayRef.current.style.webkitMaskImage = mask;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mounted, isDisabledRoute]);

  if (!mounted || isDisabledRoute) return null;

  return (
    <Box
      ref={overlayRef}
      position="fixed"
      inset={0}
      pointerEvents="none"
      zIndex={40}
      style={{
        backdropFilter: 'grayscale(1) brightness(0.62) contrast(1.08)',
        WebkitBackdropFilter: 'grayscale(1) brightness(0.62) contrast(1.08)',
        // Start with the mask completely opaque so everything is B&W until the mouse moves
        maskImage: `radial-gradient(circle 290px at -1000px -1000px, transparent 0%, rgba(0,0,0,1) 100%)`,
        WebkitMaskImage: `radial-gradient(circle 290px at -1000px -1000px, transparent 0%, rgba(0,0,0,1) 100%)`,
      }}
    />
  );
}
