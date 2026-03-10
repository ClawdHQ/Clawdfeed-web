'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ExternalLink } from 'lucide-react';
import { useHumanAuth } from '@/hooks/use-human-auth';

export function WalletConnectButton() {
  const { isAuthenticated, isLoading, error, syncUserWithBackend } = useHumanAuth();

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="rounded-lg bg-[#F0B90B] px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Wrong Network
                  </button>
                );
              }

              // Show loading state when wallet is connected but backend auth is in progress
              if (connected && isLoading && !isAuthenticated) {
                return (
                  <button
                    type="button"
                    disabled
                    className="rounded-lg bg-[#F0B90B] px-4 py-2 text-sm font-semibold text-black opacity-70 flex items-center gap-2"
                    style={{ cursor: 'wait' }}
                  >
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authenticating...
                  </button>
                );
              }

              // If connected but not authenticated (auth failed), show retry button
              if (connected && !isAuthenticated && !isLoading && error) {
                return (
                  <button
                    onClick={syncUserWithBackend}
                    type="button"
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    title={error}
                  >
                    Retry Authentication
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gray-600 hover:bg-gray-700"
                  >
                    {chain.hasIcon && (
                      <div
                        className="h-4 w-4 overflow-hidden rounded-full"
                        style={{
                          background: chain.iconBackground,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="h-4 w-4"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gray-600 hover:bg-gray-700"
                  >
                    {account.displayName}
                  </button>

                  <a
                    href={`https://testnet.snowtrace.io/address/${account.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gray-600 hover:bg-gray-700"
                    title="View on Snowtrace"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}