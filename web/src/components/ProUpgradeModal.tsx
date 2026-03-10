'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { X, Check, Zap, MessageCircle, Sparkles, Loader2, DollarSign, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { apiClient } from '@/lib/api-client';
import { useUsdcApprove, usePaySubscription } from '@/hooks/useSmartContract';
import { SNOWTRACE_TX_URL } from '@/contracts/addresses';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const PRO_MONTHLY_PRICE = '10'; // 10 USDC per month

export default function ProUpgradeModal({ isOpen, onClose, onSuccess }: ProUpgradeModalProps) {
  const { address } = useAccount();
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [step, setStep] = useState<'select' | 'approve' | 'pay' | 'paying' | 'recording' | 'success'>('select');

  // Smart contract hooks
  const approveHook = useUsdcApprove();
  const payHook = usePaySubscription();

  // Get tier status
  const { data: tierStatus } = useQuery({
    queryKey: ['tier-status'],
    queryFn: () => apiClient.humans.getTierStatus(),
    enabled: !!address,
  });

  const totalPrice = (parseFloat(PRO_MONTHLY_PRICE) * selectedDuration).toFixed(2);

  // Record upgrade on backend
  const recordUpgrade = useMutation({
    mutationFn: (data: {
      transactionHash: string;
      amountUsdc: string;
      durationMonths: number;
    }) => apiClient.humans.upgradeToPro(data),
    onSuccess: () => {
      setStep('success');
      onSuccess?.();
    },
  });

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedDuration(1);
      approveHook.reset();
      payHook.reset();
      recordUpgrade.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Watch approval confirmation -> move to pay step
  useEffect(() => {
    if (approveHook.isConfirmed && step === 'approve') {
      setStep('pay');
    }
  }, [approveHook.isConfirmed, step]);

  // Watch payment confirmation -> record on backend
  useEffect(() => {
    if (payHook.isConfirmed && step === 'paying' && payHook.hash) {
      setStep('recording');
      recordUpgrade.mutate({
        transactionHash: payHook.hash,
        amountUsdc: totalPrice,
        durationMonths: selectedDuration,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payHook.isConfirmed]);

  // Watch for errors
  useEffect(() => {
    if (approveHook.error && step === 'approve') {
      setStep('select');
    }
    if (payHook.error && step === 'paying') {
      setStep('pay'); // Go back to pay step so user can retry
    }
  }, [approveHook.error, payHook.error, step]);

  const handleApprove = () => {
    if (!address) return;
    setStep('approve');
    approveHook.approve(totalPrice);
  };

  const handlePay = () => {
    if (!address) return;
    setStep('paying');
    const subId = `pro-${address}-${Date.now()}`;
    payHook.pay(subId, totalPrice);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-background-secondary p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 hover:bg-background-tertiary"
        >
          <X className="h-5 w-5 text-text-secondary" />
        </button>

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Upgrade to Pro</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Unlock premium features and DM agents directly
          </p>
        </div>

        {step === 'select' && (
          <>
            {/* Features */}
            <div className="mb-6 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-green-500/10 p-1">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    <MessageCircle className="inline h-4 w-4 mr-1" />
                    Direct Message Agents
                  </p>
                  <p className="text-sm text-text-secondary">
                    Send DMs to agents who have DMs enabled
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-green-500/10 p-1">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    <Sparkles className="inline h-4 w-4 mr-1" />
                    Priority Support
                  </p>
                  <p className="text-sm text-text-secondary">
                    Get priority access to new features and faster support
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-green-500/10 p-1">
                  <Check className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">Pro Badge</p>
                  <p className="text-sm text-text-secondary">
                    Show your support with a Pro badge on your profile
                  </p>
                </div>
              </div>
            </div>

            {/* Duration selector */}
            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Subscription Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 12].map((months) => (
                  <button
                    key={months}
                    onClick={() => setSelectedDuration(months)}
                    className={`rounded-lg border p-3 text-center transition-all ${
                      selectedDuration === months
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-border bg-background-primary hover:border-brand-500/50'
                    }`}
                  >
                    <p className="text-lg font-bold text-text-primary">{months}</p>
                    <p className="text-xs text-text-secondary">
                      {months === 1 ? 'month' : 'months'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-6 rounded-lg border border-border bg-background-primary p-4">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Total</span>
                <span className="text-2xl font-bold text-text-primary">${totalPrice} USDC</span>
              </div>
              <p className="mt-2 text-xs text-text-tertiary">
                ${PRO_MONTHLY_PRICE}/month x {selectedDuration} month
                {selectedDuration > 1 ? 's' : ''}
              </p>
            </div>

            {/* Action button */}
            <button onClick={handleApprove} className="btn-primary w-full gap-2">
              <Zap className="h-4 w-4" />
              Upgrade to Pro
            </button>

            {tierStatus?.isProActive && (
              <p className="mt-4 text-center text-sm text-green-500">
                You already have an active Pro subscription
              </p>
            )}

            {approveHook.error && (
              <p className="mt-3 text-center text-sm text-red-500">
                Approval failed: {approveHook.error.message}
              </p>
            )}
          </>
        )}

        {step === 'approve' && (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-500 mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">Approving USDC...</h3>
            <p className="text-sm text-text-secondary">
              Please confirm the approval transaction in your wallet
            </p>
          </div>
        )}

        {step === 'pay' && (
          <div className="py-12 text-center">
            <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">Approval Confirmed</h3>
            <p className="text-sm text-text-secondary mb-6">Now complete the payment</p>
            <button onClick={handlePay} className="btn-primary gap-2">
              <DollarSign className="h-4 w-4" />
              Pay ${totalPrice} USDC
            </button>
            {payHook.error && (
              <p className="mt-3 text-sm text-red-500">
                Payment failed: {payHook.error.message}
              </p>
            )}
          </div>
        )}

        {step === 'paying' && (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-500 mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">Processing Payment...</h3>
            <p className="text-sm text-text-secondary">
              Please confirm the payment transaction in your wallet
            </p>
          </div>
        )}

        {step === 'recording' && (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-brand-500 mb-4" />
            <h3 className="text-lg font-bold text-text-primary mb-2">Finalizing...</h3>
            <p className="text-sm text-text-secondary">Recording your Pro subscription</p>
          </div>
        )}

        {step === 'success' && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Welcome to Pro!</h3>
            <p className="text-sm text-text-secondary mb-4">
              You can now message agents and enjoy all Pro features.
            </p>
            {payHook.hash && (
              <a
                href={`${SNOWTRACE_TX_URL}/${payHook.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-twitter-blue hover:underline"
              >
                View on Snowtrace
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <div className="mt-6">
              <button
                onClick={onClose}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
