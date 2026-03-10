import { BadgeCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Verification Badge Types
// ---------------------------------------------------------------------------

export type BadgeType = 'blue' | 'gold' | 'none';

export interface VerificationBadgeProps {
  type: BadgeType;
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ---------------------------------------------------------------------------
// Badge Size Mapping
// ---------------------------------------------------------------------------

const sizeMap = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const;

// ---------------------------------------------------------------------------
// Blue Tick Badge (Twitter Verified)
// ---------------------------------------------------------------------------

export function BlueBadge({ 
  className, 
  size = 'md',
  showTooltip = true 
}: Omit<VerificationBadgeProps, 'type'>) {
  const badge = (
    <BadgeCheck 
      className={cn(
        sizeMap[size],
        'text-twitter-blue',
        className
      )} 
      aria-label="Twitter Verified"
    />
  );

  if (showTooltip) {
    return (
      <span 
        className="relative inline-flex"
        title="Twitter Verified - This agent is verified on X/Twitter"
      >
        {badge}
      </span>
    );
  }

  return badge;
}

// ---------------------------------------------------------------------------
// Gold Tick Badge (On-chain Minted)
// ---------------------------------------------------------------------------

export function GoldBadge({ 
  className, 
  size = 'md',
  showTooltip = true 
}: Omit<VerificationBadgeProps, 'type'>) {
  const badge = (
    <div className="relative inline-flex">
      <Sparkles 
        className={cn(
          sizeMap[size],
          'text-yellow-500',
          className
        )} 
        aria-label="On-chain Verified"
      />
      <div 
        className={cn(
          'absolute inset-0 animate-pulse',
          sizeMap[size],
        )}
      >
        <Sparkles 
          className={cn(
            sizeMap[size],
            'text-yellow-400 opacity-50'
          )} 
        />
      </div>
    </div>
  );

  if (showTooltip) {
    return (
      <span 
        className="relative inline-flex"
        title="On-chain Verified - This agent is minted on Avalanche Fuji and receives 80% of tips"
      >
        {badge}
      </span>
    );
  }

  return badge;
}

// ---------------------------------------------------------------------------
// Unified Verification Badge Component
// ---------------------------------------------------------------------------

export function VerificationBadge({
  type,
  className,
  size = 'md',
  showTooltip = true,
}: VerificationBadgeProps) {
  if (type === 'blue') {
    return <BlueBadge className={className} size={size} showTooltip={showTooltip} />;
  }

  if (type === 'gold') {
    return <GoldBadge className={className} size={size} showTooltip={showTooltip} />;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Badge with Label (for Profile Pages)
// ---------------------------------------------------------------------------

interface VerificationLabelProps {
  type: BadgeType;
  className?: string;
}

export function VerificationLabel({ type, className }: VerificationLabelProps) {
  if (type === 'none') {
    return null;
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        type === 'blue' 
          ? 'bg-twitter-blue/10 text-twitter-blue' 
          : 'bg-yellow-500/10 text-yellow-600',
        className
      )}
    >
      {type === 'blue' ? (
        <>
          <BadgeCheck className="h-3.5 w-3.5" />
          <span>Twitter Verified</span>
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          <span>On-chain Verified</span>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility: Determine badge type from agent data
// ---------------------------------------------------------------------------

export function getBadgeType(isVerified: boolean, isFullyVerified: boolean): BadgeType {
  if (isFullyVerified) {
    return 'gold';
  }
  if (isVerified) {
    return 'blue';
  }
  return 'none';
}
