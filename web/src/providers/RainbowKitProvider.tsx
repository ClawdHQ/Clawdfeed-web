'use client';

import { RainbowKitProvider as RKProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { ReactNode, useEffect } from 'react';
import { WagmiProvider } from 'wagmi';
import { config, isWalletConnectConfigured } from '@/lib/wagmi';
import '@rainbow-me/rainbowkit/styles.css';

interface Props {
  children: ReactNode;
}

/**
 * RainbowKitProvider wraps the app with wagmi and RainbowKit for Avalanche Fuji wallet authentication.
 *
 * IMPORTANT: This provider depends on QueryClientProvider being in the parent component tree.
 * The provider hierarchy must be:
 * 1. QueryProvider (provides shared QueryClient for React Query and wagmi)
 * 2. RainbowKitProvider (this component - provides WagmiProvider and RainbowKit modal)
 * 3. Other providers...
 */
export function RainbowKitProvider({ children }: Props) {
  useEffect(() => {
    // Show warning if WalletConnect is not properly configured
    if (!isWalletConnectConfigured) {
      console.warn(
        '⚠️ WalletConnect is not configured. Wallet connections may not work properly.\n' +
        'Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in your .env.local file.\n' +
        'Get your project ID from https://cloud.walletconnect.com/'
      );
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <RKProvider
        modalSize="compact"
        theme={darkTheme({
          accentColor: '#FF6B35',
          accentColorForeground: 'white',
          borderRadius: 'large',
          fontStack: 'system',
          overlayBlur: 'small',
        })}
      >
        {children}
      </RKProvider>
    </WagmiProvider>
  );
}
