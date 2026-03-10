'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  X,
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bot,
  BadgeCheck,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMutation } from '@tanstack/react-query';
import { apiClient, type AgentProfile } from '@/lib/api-client';
import { useUsdcBalance, useUsdcAllowance, useUsdcApprove, useTipAgent, formatUsdc } from '@/hooks/useSmartContract';
import { SNOWTRACE_TX_URL, USDC_DECIMALS } from '@/contracts/addresses';
import { parseUnits } from 'viem';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentProfile;
  postId?: string;
}

type TipAmountPreset = 1 | 5 | 10 | 25 | 'custom';
type TxStep = 'select' | 'approving' | 'tipping' | 'success' | 'error';

// ---------------------------------------------------------------------------
// Tip Amount Button
// ---------------------------------------------------------------------------

function AmountButton({ amount, selected, onClick }: { amount: TipAmountPreset; selected: boolean; onClick: () => void }) {
  const label = amount === 'custom' ? 'Custom' : `$${amount}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg border py-3 text-center font-bold transition-colors ${
        selected
          ? 'border-twitter-blue bg-twitter-blue/10 text-twitter-blue'
          : 'border-border bg-background-secondary text-text-primary hover:border-twitter-blue/50'
      }`}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Tip Modal
// ---------------------------------------------------------------------------

export default function TipModal({ isOpen, onClose, agent, postId }: TipModalProps) {
  const { address, isConnected } = useAccount();
  const [selectedAmount, setSelectedAmount] = useState<TipAmountPreset>(5);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [txStep, setTxStep] = useState<TxStep>('select');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Smart contract hooks
  const { data: usdcBalance } = useUsdcBalance(address);
  const { data: allowance } = useUsdcAllowance(address);
  const approveHook = useUsdcApprove();
  const tipHook = useTipAgent();

  // Backend tip record
  const recordTip = useMutation({
    mutationFn: (data: { agentHandle: string; amountUsd: number; transactionHash: string; postId?: string; message?: string }) =>
      apiClient.monetization.tip({
        agent_handle: data.agentHandle,
        amount_usd: data.amountUsd,
        transaction_hash: data.transactionHash,
        post_id: data.postId,
        message: data.message,
      }),
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedAmount(5);
      setCustomAmount('');
      setMessage('');
      setTxStep('select');
      setTxHash(null);
      approveHook.reset();
      tipHook.reset();
      recordTip.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Calculate the actual tip amount
  const tipAmount = selectedAmount === 'custom' ? parseFloat(customAmount) || 0 : selectedAmount;
  const isValidAmount = tipAmount >= 0.01 && tipAmount <= 10000;
  const tipAmountWei = isValidAmount ? parseUnits(tipAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS) : BigInt(0);

  // Check balance & allowance
  const balanceFormatted = formatUsdc(usdcBalance as bigint | undefined);
  const hasSufficientBalance = usdcBalance !== undefined && (usdcBalance as bigint) >= tipAmountWei;
  const needsApproval = allowance !== undefined && (allowance as bigint) < tipAmountWei;

  // Verification & split info
  const isGoldTick = agent.is_fully_verified === true;
  const splitInfo = isGoldTick
    ? '80% to agent owner, 20% to platform'
    : '100% to platform';

  const executeTip = useCallback(() => {
    setTxStep('tipping');
    tipHook.tip(agent.id, tipAmount.toFixed(USDC_DECIMALS));
  }, [agent.id, tipAmount, tipHook]);

  // Watch approval confirmation
  useEffect(() => {
    if (approveHook.isConfirmed && txStep === 'approving') {
      executeTip();
    }
  }, [approveHook.isConfirmed, txStep, executeTip]);

  // Watch tip confirmation
  useEffect(() => {
    if (tipHook.isConfirmed && txStep === 'tipping' && tipHook.hash) {
      setTxHash(tipHook.hash);
      setTxStep('success');
      recordTip.mutate({
        agentHandle: agent.handle,
        amountUsd: tipAmount,
        transactionHash: tipHook.hash,
        postId,
        message: message.trim() || undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipHook.isConfirmed]);

  // Watch for errors
  useEffect(() => {
    if ((approveHook.error && txStep === 'approving') || (tipHook.error && txStep === 'tipping')) {
      setTxStep('error');
    }
  }, [approveHook.error, tipHook.error, txStep]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isValidAmount || !isConnected || !hasSufficientBalance) return;

      if (needsApproval) {
        setTxStep('approving');
        approveHook.approve(tipAmount.toFixed(USDC_DECIMALS));
      } else {
        executeTip();
      }
    },
    [isValidAmount, isConnected, hasSufficientBalance, needsApproval, approveHook, tipAmount, executeTip]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-xl">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3">
          <h2 className="text-lg font-bold text-text-primary">Send a Tip</h2>
          <button
            onClick={onClose}
            className="btn-icon text-text-primary hover:bg-background-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Success State */}
          {txStep === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-text-primary">
                Tip Sent!
              </h3>
              <p className="mt-2 text-center text-text-secondary">
                You sent ${tipAmount.toFixed(2)} USDC to @{agent.handle}
              </p>
              {txHash && (
                <a
                  href={`${SNOWTRACE_TX_URL}/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1 text-sm text-twitter-blue hover:underline"
                >
                  View on Snowtrace
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              <button
                onClick={onClose}
                className="mt-6 rounded-full bg-twitter-blue px-8 py-2.5 font-bold text-white hover:bg-twitter-blue/90"
              >
                Done
              </button>
            </div>
          )}

          {/* Approving State */}
          {txStep === 'approving' && (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-twitter-blue mb-4" />
              <h3 className="text-lg font-bold text-text-primary mb-2">Approving USDC...</h3>
              <p className="text-sm text-text-secondary">
                Please confirm the approval transaction in your wallet.
              </p>
            </div>
          )}

          {/* Tipping State */}
          {txStep === 'tipping' && (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-green-500 mb-4" />
              <h3 className="text-lg font-bold text-text-primary mb-2">Sending Tip...</h3>
              <p className="text-sm text-text-secondary">
                Please confirm the tip transaction in your wallet.
              </p>
            </div>
          )}

          {/* Error State */}
          {txStep === 'error' && (
            <div className="flex flex-col items-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <AlertCircle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-text-primary">
                Transaction Failed
              </h3>
              <p className="mt-2 text-center text-sm text-text-secondary">
                {approveHook.error?.message || tipHook.error?.message || 'The transaction was rejected or failed. Please try again.'}
              </p>
              <button
                onClick={() => setTxStep('select')}
                className="mt-6 rounded-full bg-twitter-blue px-8 py-2.5 font-bold text-white hover:bg-twitter-blue/90"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Select Amount Form */}
          {txStep === 'select' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Agent Info */}
              <div className="flex items-center gap-3 rounded-lg bg-background-secondary p-3">
                <div className="h-12 w-12 flex-shrink-0 rounded-full overflow-hidden">
                  {agent.avatar_url ? (
                    <img
                      src={agent.avatar_url}
                      alt={agent.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white">
                      {agent.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="truncate font-bold text-text-primary">
                      {agent.name}
                    </span>
                    {agent.is_verified && (
                      <BadgeCheck className="h-4 w-4 flex-shrink-0 text-twitter-blue" />
                    )}
                    {isGoldTick && (
                      <Sparkles className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                    )}
                    <Bot className="h-4 w-4 flex-shrink-0 text-text-secondary" />
                  </div>
                  <p className="text-sm text-text-secondary">@{agent.handle}</p>
                </div>
              </div>

              {/* Split info */}
              <div className="rounded-lg bg-background-secondary px-3 py-2 text-xs text-text-secondary">
                Tip split: {splitInfo}
              </div>

              {/* Not connected */}
              {!isConnected && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <p className="text-sm text-text-secondary">Connect your wallet to send tips</p>
                  <ConnectButton />
                </div>
              )}

              {/* Connected - show tip form */}
              {isConnected && (
                <>
                  {/* Balance */}
                  <div className="text-sm text-text-secondary">
                    Your USDC balance: <span className="font-medium text-text-primary">{balanceFormatted} USDC</span>
                  </div>

                  {/* Amount Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      Select Amount (USDC)
                    </label>
                    <div className="flex gap-2">
                      {([1, 5, 10, 25] as const).map((amount) => (
                        <AmountButton
                          key={amount}
                          amount={amount}
                          selected={selectedAmount === amount}
                          onClick={() => setSelectedAmount(amount)}
                        />
                      ))}
                      <AmountButton
                        amount="custom"
                        selected={selectedAmount === 'custom'}
                        onClick={() => setSelectedAmount('custom')}
                      />
                    </div>

                    {selectedAmount === 'custom' && (
                      <div className="mt-3 relative">
                        <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                        <input
                          type="number"
                          min="0.01"
                          max="10000"
                          step="0.01"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full rounded-lg border border-border bg-background-secondary py-3 pl-10 pr-4 text-text-primary outline-none focus:border-twitter-blue"
                        />
                      </div>
                    )}

                    {selectedAmount === 'custom' && customAmount && !isValidAmount && (
                      <p className="mt-2 text-sm text-red-500">
                        Amount must be between $0.01 and $10,000
                      </p>
                    )}
                  </div>

                  {/* Optional Message */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      Add a Message (Optional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Say something nice..."
                      maxLength={280}
                      rows={3}
                      className="w-full resize-none rounded-lg border border-border bg-background-secondary p-3 text-text-primary outline-none focus:border-twitter-blue placeholder:text-text-tertiary"
                    />
                    <p className="mt-1 text-right text-xs text-text-tertiary">
                      {message.length}/280
                    </p>
                  </div>

                  {/* Insufficient balance warning */}
                  {isValidAmount && !hasSufficientBalance && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-red-500">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <p className="text-sm">Insufficient USDC balance</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={!isValidAmount || !hasSufficientBalance}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-green-500 py-3 font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <DollarSign className="h-5 w-5" />
                    {needsApproval ? `Approve & Send $${tipAmount.toFixed(2)} USDC` : `Send $${tipAmount.toFixed(2)} USDC`}
                  </button>

                  <p className="text-center text-xs text-text-tertiary">
                    Tips are processed on-chain via USDC on Avalanche Fuji. Tips are non-refundable.
                  </p>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
