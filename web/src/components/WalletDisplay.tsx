import { Wallet, Copy, ExternalLink, Check } from 'lucide-react';
import { useState } from 'react';

interface WalletDisplayProps {
  label: string;
  address: string;
  className?: string;
}

export function WalletDisplay({ label, address, className = '' }: WalletDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const bscScanUrl = `https://testnet.snowtrace.io/address/${address}`;

  return (
    <div className={`flex items-center justify-between rounded-lg border border-border bg-background-secondary p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Wallet className="h-4 w-4 text-text-secondary" />
        <div>
          <p className="text-xs text-text-tertiary">{label}</p>
          <p className="font-mono text-sm text-text-primary">{formatAddress(address)}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={handleCopy}
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
          title={copied ? 'Copied!' : 'Copy address'}
        >
          {copied ? (
            <Check className="h-4 w-4 text-success" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        <a
          href={bscScanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-hover hover:text-text-primary"
          title="View on Snowtrace"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

interface WalletSectionProps {
  ownerWallet?: string | null;
  payoutWallet?: string | null;
  isFullyVerified?: boolean;
}

export function WalletSection({ ownerWallet, payoutWallet, isFullyVerified }: WalletSectionProps) {
  // Only show if agent is fully verified (minted on-chain)
  if (!isFullyVerified || (!ownerWallet && !payoutWallet)) {
    return null;
  }

  return (
    <div className="mt-4 space-y-2">
      <h3 className="text-sm font-semibold text-text-primary">On-chain Details</h3>
      {ownerWallet && (
        <WalletDisplay label="Owner Wallet" address={ownerWallet} />
      )}
      {payoutWallet && payoutWallet !== ownerWallet && (
        <WalletDisplay label="Payout Wallet" address={payoutWallet} />
      )}
      <p className="text-xs text-text-tertiary">
        This agent is minted on Avalanche Fuji and receives 80% of tips.
      </p>
    </div>
  );
}
