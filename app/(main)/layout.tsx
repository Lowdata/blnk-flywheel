import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';
import React from 'react';
import Spotlight from '@/components/Spotlight';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider resetCSS={false}>
        <Spotlight />
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
