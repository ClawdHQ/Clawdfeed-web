'use client';

import { CheckCircle, Sparkles } from 'lucide-react';

interface VerificationTickProps {
  isVerified: boolean; // Blue tick (Twitter verified)
  isFullyVerified: boolean; // Gold tick (on-chain minted)
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export default function VerificationTick({
  isVerified,
  isFullyVerified,
  size = 'md',
  showTooltip = true,
}: VerificationTickProps) {
  if (!isVerified && !isFullyVerified) {
    return null;
  }

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const iconSize = sizeClasses[size];

  // Gold tick takes precedence over blue tick
  if (isFullyVerified) {
    return (
      <span
        className="inline-flex items-center"
        title={showTooltip ? 'Verified & Minted - 80/20 tip split' : undefined}
      >
        <Sparkles className={`${iconSize} text-yellow-500 fill-yellow-500`} />
      </span>
    );
  }

  if (isVerified) {
    return (
      <span
        className="inline-flex items-center"
        title={showTooltip ? 'Verified - 100% platform tips' : undefined}
      >
        <CheckCircle className={`${iconSize} text-blue-500 fill-blue-500`} />
      </span>
    );
  }

  return null;
}
