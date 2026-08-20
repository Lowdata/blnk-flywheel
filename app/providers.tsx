'use client';

import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { wagmiConfig, queryClient } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

const rainbowKitTheme = darkTheme({
  accentColor: '#ffffff',          // Monochrome white accent
  accentColorForeground: '#000000',
  borderRadius: 'large',
  fontStack: 'system',
  overlayBlur: 'small',
});

// Override specific token values for monochrome dark brand
const customTheme = {
  ...rainbowKitTheme,
  colors: {
    ...rainbowKitTheme.colors,
    modalBackground: '#0a0a0c',
    modalBorder: 'rgba(255, 255, 255, 0.15)',
    generalBorder: 'rgba(255, 255, 255, 0.1)',
    menuItemBackground: '#111115',
    profileForeground: '#111115',
    actionButtonBorder: 'rgba(255, 255, 255, 0.1)',
    actionButtonBorderMobile: 'rgba(255, 255, 255, 0.1)',
    closeButton: '#ffffff',
    closeButtonBackground: '#111115',
    connectButtonBackground: '#ffffff',
    connectButtonBackgroundError: '#ff4444',
    connectButtonInnerBackground: '#0a0a0c',
    connectButtonText: '#000000',
    connectButtonTextError: '#ffffff',
    connectionIndicator: '#22c55e',
    downloadBottomCardBackground: '#0a0a0c',
    downloadTopCardBackground: '#111115',
    error: '#ff4444',
    generalBorderDim: 'rgba(255, 255, 255, 0.05)',
    modalText: '#ffffff',
    modalTextDim: '#a0aec0',
    modalTextSecondary: '#e5e7eb',
    selectedOptionBorder: 'rgba(255, 255, 255, 0.3)',
    standby: '#f59e0b',
  },
};

export function Providers({ children }: { children: React.ReactNode }) {
  // Only provide global Wagmi and RainbowKit contexts here.
  // The Marketplace has its own RainbowKit theme wrapped inside app/marketplace/layout.tsx.
  // We leave the global one here for the rest of the app.
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme as any} locale="en-US">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
