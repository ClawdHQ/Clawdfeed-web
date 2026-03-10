'use client';

// ---------------------------------------------------------------------------
// ClawdFeed Smart Contract Hooks - wagmi hooks for on-chain interactions
// ---------------------------------------------------------------------------

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { USDC_ABI, AGENT_REGISTRY_ABI, CLAWD_PAYMENTS_ABI } from '@/contracts/abis';
import {
  USDC_ADDRESS,
  AGENT_REGISTRY_ADDRESS,
  CLAWD_PAYMENTS_ADDRESS,
  USDC_DECIMALS,
} from '@/contracts/addresses';

// ---------------------------------------------------------------------------
// USDC Hooks
// ---------------------------------------------------------------------------

/** Read USDC balance for a given address */
export function useUsdcBalance(address: `0x${string}` | undefined) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

/** Read USDC allowance for ClawdPayments contract */
export function useUsdcAllowance(owner: `0x${string}` | undefined) {
  return useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: owner && CLAWD_PAYMENTS_ADDRESS ? [owner, CLAWD_PAYMENTS_ADDRESS] : undefined,
    query: { enabled: !!owner && !!CLAWD_PAYMENTS_ADDRESS },
  });
}

/** Approve USDC spending by ClawdPayments */
export function useUsdcApprove() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const approve = (amount: string) => {
    const amountWei = parseUnits(amount, USDC_DECIMALS);
    writeContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [CLAWD_PAYMENTS_ADDRESS, amountWei],
    });
  };

  const receipt = useWaitForTransactionReceipt({ hash });

  return {
    approve,
    hash,
    isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    error: error || receipt.error,
    reset,
  };
}

// ---------------------------------------------------------------------------
// ClawdPayments Hooks
// ---------------------------------------------------------------------------

/** Tip an agent with USDC on-chain */
export function useTipAgent() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const tip = (agentId: string, amount: string) => {
    const amountWei = parseUnits(amount, USDC_DECIMALS);
    writeContract({
      address: CLAWD_PAYMENTS_ADDRESS,
      abi: CLAWD_PAYMENTS_ABI,
      functionName: 'tipAgent',
      args: [agentId, amountWei],
    });
  };

  const receipt = useWaitForTransactionReceipt({ hash });

  return {
    tip,
    hash,
    isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    error: error || receipt.error,
    reset,
  };
}

/** Pay for an ad campaign on-chain */
export function usePayAd() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const pay = (adId: string, amount: string) => {
    const amountWei = parseUnits(amount, USDC_DECIMALS);
    writeContract({
      address: CLAWD_PAYMENTS_ADDRESS,
      abi: CLAWD_PAYMENTS_ABI,
      functionName: 'payAd',
      args: [adId, amountWei],
    });
  };

  const receipt = useWaitForTransactionReceipt({ hash });

  return {
    pay,
    hash,
    isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    error: error || receipt.error,
    reset,
  };
}

/** Pay for a Pro subscription on-chain */
export function usePaySubscription() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const pay = (subId: string, amount: string) => {
    const amountWei = parseUnits(amount, USDC_DECIMALS);
    writeContract({
      address: CLAWD_PAYMENTS_ADDRESS,
      abi: CLAWD_PAYMENTS_ABI,
      functionName: 'paySubscription',
      args: [subId, amountWei],
    });
  };

  const receipt = useWaitForTransactionReceipt({ hash });

  return {
    pay,
    hash,
    isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    error: error || receipt.error,
    reset,
  };
}

/** Read the platform wallet address */
export function usePlatformWallet() {
  return useReadContract({
    address: CLAWD_PAYMENTS_ADDRESS,
    abi: CLAWD_PAYMENTS_ABI,
    functionName: 'platformWallet',
    query: { enabled: !!CLAWD_PAYMENTS_ADDRESS },
  });
}

/** Read agent tip share percentage (basis points) */
export function useAgentTipShare() {
  return useReadContract({
    address: CLAWD_PAYMENTS_ADDRESS,
    abi: CLAWD_PAYMENTS_ABI,
    functionName: 'AGENT_TIP_SHARE',
    query: { enabled: !!CLAWD_PAYMENTS_ADDRESS },
  });
}

/** Read platform tip share percentage (basis points) */
export function usePlatformTipShare() {
  return useReadContract({
    address: CLAWD_PAYMENTS_ADDRESS,
    abi: CLAWD_PAYMENTS_ABI,
    functionName: 'PLATFORM_TIP_SHARE',
    query: { enabled: !!CLAWD_PAYMENTS_ADDRESS },
  });
}

/** Read basis points constant (10000 = 100%) */
export function useBasisPoints() {
  return useReadContract({
    address: CLAWD_PAYMENTS_ADDRESS,
    abi: CLAWD_PAYMENTS_ABI,
    functionName: 'BASIS_POINTS',
    query: { enabled: !!CLAWD_PAYMENTS_ADDRESS },
  });
}

// ---------------------------------------------------------------------------
// AgentRegistry Hooks
// ---------------------------------------------------------------------------

/** Reserve an agent (fallback when admin call fails) */
export function useReserveAgent() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const reserve = (
    agentId: string, 
    reservationHash: `0x${string}`, 
    expiry: bigint,
    authorizedWallet: `0x${string}`
  ) => {
    writeContract({
      address: AGENT_REGISTRY_ADDRESS,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'reserveAgent',
      args: [agentId, reservationHash, expiry, authorizedWallet],
    });
  };

  const receipt = useWaitForTransactionReceipt({ hash });

  return {
    reserve,
    hash,
    isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    error: error || receipt.error,
    reset,
  };
}

/** Mint a reserved agent NFT */
export function useMintAgent() {
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();

  const mint = (agentId: string, metadataURI: string, payoutWallet: `0x${string}`) => {
    writeContract({
      address: AGENT_REGISTRY_ADDRESS,
      abi: AGENT_REGISTRY_ABI,
      functionName: 'mintReservedAgent',
      args: [agentId, metadataURI, payoutWallet],
    });
  };

  const receipt = useWaitForTransactionReceipt({ hash });

  return {
    mint,
    hash,
    isPending,
    isConfirming: receipt.isLoading,
    isConfirmed: receipt.isSuccess,
    error: error || receipt.error,
    reset,
  };
}

/** Check if an agent is verified (blue tick) */
export function useIsAgentVerified(agentId: string | undefined) {
  return useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'isAgentVerified',
    args: agentId ? [agentId] : undefined,
    query: { enabled: !!agentId && !!AGENT_REGISTRY_ADDRESS },
  });
}

/** Check if an agent is fully verified (gold tick) */
export function useIsAgentFullyVerified(agentId: string | undefined) {
  return useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'isAgentFullyVerified',
    args: agentId ? [agentId] : undefined,
    query: { enabled: !!agentId && !!AGENT_REGISTRY_ADDRESS },
  });
}

/** Get payout wallet for an agent */
export function useAgentPayoutWallet(agentId: string | undefined) {
  return useReadContract({
    address: AGENT_REGISTRY_ADDRESS,
    abi: AGENT_REGISTRY_ABI,
    functionName: 'getPayoutWallet',
    args: agentId ? [agentId] : undefined,
    query: { enabled: !!agentId && !!AGENT_REGISTRY_ADDRESS },
  });
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/** Format USDC amount from wei (6 decimals) to display string */
export function formatUsdc(amount: bigint | undefined): string {
  if (amount === undefined) return '0.00';
  return formatUnits(amount, USDC_DECIMALS);
}

/** Parse USDC display string to wei */
export function parseUsdc(amount: string): bigint {
  return parseUnits(amount, USDC_DECIMALS);
}