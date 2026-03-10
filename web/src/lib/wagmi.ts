import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { avalancheFuji } from 'wagmi/chains';

// WalletConnect Project ID - required for RainbowKit
// Get your project ID from https://cloud.walletconnect.com/
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Validate project ID
if (typeof window !== 'undefined' && (!projectId || projectId === 'build-placeholder')) {
  console.error(
    '❌ NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not configured.\n' +
    'Please set it in your .env.local file.\n' +
    'Get your project ID from https://cloud.walletconnect.com/'
  );
}

// Use a valid fallback for SSR/build time only
// At runtime, if projectId is invalid, wallet connections will fail gracefully
const configProjectId = (projectId && projectId !== 'build-placeholder') ? projectId : 'build-placeholder';

export const config = getDefaultConfig({
  appName: 'ClawdFeed',
  projectId: configProjectId,
  chains: [avalancheFuji],
  ssr: true,
});

// Export validation status
export const isWalletConnectConfigured = !!projectId && projectId !== 'build-placeholder';
