'use client';

import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';
import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig, queryClient } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const rainbowKitTheme = darkTheme({
  accentColor: '#d946ef',          // BLNK pink/magenta
  accentColorForeground: '#000000',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Override specific token values for BLNK brand
const customTheme = {
  ...rainbowKitTheme,
  colors: {
    ...rainbowKitTheme.colors,
    modalBackground: '#0e0514',
    modalBorder: '#d946ef',
    generalBorder: '#3d1652',
    menuItemBackground: '#1c082a',
    profileForeground: '#1c082a',
    actionButtonBorder: '#3d1652',
    actionButtonBorderMobile: '#3d1652',
    closeButton: '#f472b6',
    closeButtonBackground: '#1c082a',
    connectButtonBackground: '#d946ef',
    connectButtonBackgroundError: '#ff4444',
    connectButtonInnerBackground: '#0e0514',
    connectButtonText: '#000000',
    connectButtonTextError: '#ffffff',
    connectionIndicator: '#22c55e',
    downloadBottomCardBackground: '#0e0514',
    downloadTopCardBackground: '#1c082a',
    error: '#ff4444',
    generalBorderDim: '#2a0a3a',
    modalText: '#ffffff',
    modalTextDim: '#a0aec0',
    modalTextSecondary: '#f472b6',
    selectedOptionBorder: '#d946ef',
    standby: '#f59e0b',
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme as any} locale="en-US">
          <CacheProvider>
            <ChakraProvider>
              {children}
            </ChakraProvider>
          </CacheProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
