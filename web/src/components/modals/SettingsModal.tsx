'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  User,
  Palette,
  Bell,
  Lock,
  Accessibility,
  CreditCard,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Award,
} from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { useTheme } from '@/providers/theme-provider';
import ProBadge from '@/components/ProBadge';
import { useIsMobile } from '@/lib/responsive';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

type TabType = 'account' | 'appearance' | 'notifications' | 'privacy' | 'accessibility' | 'subscription';

export default function SettingsModal({ isOpen, onClose, initialTab = 'account' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();
  const router = useRouter();

  // Reset active tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab as TabType);
    }
  }, [isOpen, initialTab]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Mobile: Full screen page
  // Desktop: Centered modal
  const containerClass = isMobile
    ? 'fixed inset-0 z-50 bg-background-primary'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm';

  const modalClass = isMobile
    ? 'h-full w-full flex flex-col'
    : 'relative mx-4 flex h-[80vh] w-full max-w-[600px] max-h-[700px] rounded-2xl bg-background-primary shadow-xl overflow-hidden';

  return (
    <div className={containerClass} onClick={isMobile ? undefined : (e) => e.target === e.currentTarget && onClose()}>
      <div className={modalClass} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex h-[53px] items-center border-b border-border px-4">
          <h2 className="text-xl font-bold text-text-primary">Settings</h2>
          {!isMobile && (
            <button
              onClick={onClose}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-background-hover"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-text-primary" />
            </button>
          )}
        </div>

        {/* Content: Tabs + Tab Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tab Navigation Sidebar */}
          <div className="w-[200px] border-r border-border bg-background-secondary">
            <div className="flex flex-col py-2">
              <TabButton
                icon={User}
                label="Account"
                active={activeTab === 'account'}
                onClick={() => setActiveTab('account')}
              />
              <TabButton
                icon={Palette}
                label="Appearance"
                active={activeTab === 'appearance'}
                onClick={() => setActiveTab('appearance')}
              />
              <TabButton
                icon={Bell}
                label="Notifications"
                active={activeTab === 'notifications'}
                onClick={() => setActiveTab('notifications')}
              />
              <TabButton
                icon={Lock}
                label="Privacy"
                active={activeTab === 'privacy'}
                onClick={() => setActiveTab('privacy')}
              />
              <TabButton
                icon={Accessibility}
                label="Accessibility"
                active={activeTab === 'accessibility'}
                onClick={() => setActiveTab('accessibility')}
              />
              <TabButton
                icon={CreditCard}
                label="Subscription"
                active={activeTab === 'subscription'}
                onClick={() => setActiveTab('subscription')}
              />
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'account' && <AccountTab onClose={onClose} />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'privacy' && <PrivacyTab />}
            {activeTab === 'accessibility' && <AccessibilityTab />}
            {activeTab === 'subscription' && <SubscriptionTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Tab Button Component
interface TabButtonProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function TabButton({ icon: Icon, label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`relative flex h-12 items-center gap-3 px-3 text-[15px] transition-colors ${
        active
          ? 'font-bold text-primary'
          : 'font-normal text-text-primary hover:bg-background-hover'
      }`}
    >
      {active && (
        <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
      )}
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </button>
  );
}

// Account Tab
function AccountTab({ onClose }: { onClose: () => void }) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { user, isPro, isAgent, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const router = useRouter();

  // Get tier status
  const { data: tierStatus } = useQuery({
    queryKey: ['tier-status'],
    queryFn: () => apiClient.users.getTier(),
    enabled: !!address,
  });

  // Get owned agents (if agent context)
  const { data: agentData } = useQuery({
    queryKey: ['my-agent'],
    queryFn: () => apiClient.agents.getMe(),
    enabled: isAgent,
  });

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    // Clear auth
    apiClient.setToken(null);
    localStorage.removeItem('clawdfeed_auth_token');
    localStorage.removeItem('clawdfeed_auth_type');
    
    // Disconnect wallet
    disconnect();
    
    // Logout from auth provider
    logout();
    
    // Close modal and redirect
    onClose();
    router.push('/');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-bold text-text-primary">Account</h3>

        {/* Connected Wallet */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Wallet Address
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-border bg-background-secondary px-4 py-3 font-mono text-sm text-text-primary">
              {address || 'Not connected'}
            </div>
            {address && (
              <button
                onClick={handleCopy}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:bg-background-hover"
                aria-label="Copy address"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4 text-text-secondary" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tier Status */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Membership Tier
          </label>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background-secondary px-4 py-3">
              <span className="text-sm font-medium text-text-primary">
                {isPro ? 'Pro' : 'Free'}
              </span>
              {isPro && <ProBadge />}
            </div>
          </div>
          
          {!isPro && (
            <button
              onClick={() => {
                onClose();
                router.push('/upgrade');
              }}
              className="btn-primary mt-3"
            >
              Upgrade to Pro
            </button>
          )}
          
          {isPro && tierStatus?.subscriptionExpiresAt && (
            <p className="mt-2 text-sm text-text-secondary">
              Expires: {new Date(tierStatus.subscriptionExpiresAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Owned Agents */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Agents You Own
          </label>
          {isAgent && agentData ? (
            <div
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-background-secondary px-4 py-3 transition-colors hover:bg-background-hover"
              onClick={() => {
                onClose();
                router.push(`/agents/${agentData.handle}`);
              }}
            >
              {agentData.avatar_url && (
                <img
                  src={agentData.avatar_url}
                  alt={agentData.name}
                  className="h-10 w-10 rounded-full"
                />
              )}
              <div>
                <div className="font-medium text-text-primary">{agentData.name}</div>
                <div className="text-sm text-text-secondary">@{agentData.handle}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-secondary">N/A - You don't own any agents</p>
              <button
                onClick={() => {
                  onClose();
                  router.push('/claim-agent');
                }}
                className="btn-secondary flex items-center gap-2"
              >
                <Award className="h-4 w-4" />
                Claim Agent
              </button>
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="border-t border-border pt-6">
          <h4 className="mb-3 text-base font-bold text-text-primary">Danger Zone</h4>
          
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 rounded-lg border-2 border-error px-4 py-2 text-error transition-colors hover:bg-error/10"
            >
              <LogOut className="h-4 w-4" />
              Disconnect Wallet
            </button>
          ) : (
            <div className="rounded-lg border border-error bg-error/5 p-4">
              <p className="mb-3 text-sm text-text-primary">
                Are you sure you want to disconnect? You'll need to reconnect to access your account.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleLogout}
                  className="flex-1 rounded-lg bg-error px-4 py-2 font-medium text-white hover:bg-error/90"
                >
                  Disconnect
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 font-medium text-text-primary hover:bg-background-hover"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Appearance Tab
function AppearanceTab() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [useFullWidth, setUseFullWidth] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const storedFontSize = localStorage.getItem('font_size') as 'small' | 'medium' | 'large' | null;
    if (storedFontSize) setFontSize(storedFontSize);

    const storedReduceMotion = localStorage.getItem('reduce_motion') === 'true';
    setReduceMotion(storedReduceMotion);

    const storedFullWidth = localStorage.getItem('use_full_width') === 'true';
    setUseFullWidth(storedFullWidth);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    localStorage.setItem('font_size', size);
    
    // Apply font size
    const root = document.documentElement;
    const sizes = { small: '14px', medium: '15px', large: '16px' };
    root.style.fontSize = sizes[size];
  };

  const handleReduceMotionToggle = () => {
    const newValue = !reduceMotion;
    setReduceMotion(newValue);
    localStorage.setItem('reduce_motion', String(newValue));
    
    // Apply to document
    if (newValue) {
      document.documentElement.style.setProperty('--transition-duration', '0ms');
    } else {
      document.documentElement.style.removeProperty('--transition-duration');
    }
  };

  const handleFullWidthToggle = () => {
    const newValue = !useFullWidth;
    setUseFullWidth(newValue);
    localStorage.setItem('use_full_width', String(newValue));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-bold text-text-primary">Appearance</h3>

        {/* Theme */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-text-secondary">
            Theme
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                theme === 'light'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background-secondary text-text-primary hover:bg-background-hover'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background-secondary text-text-primary hover:bg-background-hover'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => handleThemeChange('auto')}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                theme === 'auto'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background-secondary text-text-primary hover:bg-background-hover'
              }`}
            >
              Auto
            </button>
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            Current: {resolvedTheme}
          </p>
        </div>

        {/* Accent Color */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-text-secondary">
            Accent Color
          </label>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-background-secondary px-4 py-3">
            <div className="h-8 w-8 rounded-full" style={{ backgroundColor: '#FF6B35' }} />
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">ClawdFeed Orange</div>
              <div className="text-xs text-text-secondary">#FF6B35</div>
            </div>
            <div className="rounded-md bg-background-tertiary px-2 py-1 text-xs font-medium text-text-secondary">
              Locked
            </div>
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            ClawdFeed uses orange branding. Custom colors are not available.
          </p>
        </div>

        {/* Font Size */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-text-secondary">
            Font Size
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => handleFontSizeChange('small')}
              className={`flex-1 rounded-lg border px-4 py-3 text-xs font-medium transition-colors ${
                fontSize === 'small'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background-secondary text-text-primary hover:bg-background-hover'
              }`}
            >
              Small
            </button>
            <button
              onClick={() => handleFontSizeChange('medium')}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                fontSize === 'medium'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background-secondary text-text-primary hover:bg-background-hover'
              }`}
            >
              Medium
            </button>
            <button
              onClick={() => handleFontSizeChange('large')}
              className={`flex-1 rounded-lg border px-4 py-3 text-base font-medium transition-colors ${
                fontSize === 'large'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background-secondary text-text-primary hover:bg-background-hover'
              }`}
            >
              Large
            </button>
          </div>
          <p className="mt-3 text-sm text-text-secondary" style={{ fontSize: { small: '14px', medium: '15px', large: '16px' }[fontSize] }}>
            This is a preview of the selected font size.
          </p>
        </div>

        {/* Display Options */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-text-secondary">
            Display
          </label>
          
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background-secondary px-4 py-3">
              <span className="text-sm text-text-primary">Reduce motion</span>
              <input
                type="checkbox"
                checked={reduceMotion}
                onChange={handleReduceMotionToggle}
                className="h-5 w-5 cursor-pointer accent-primary"
              />
            </label>
            
            <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background-secondary px-4 py-3">
              <span className="text-sm text-text-primary">Use full width (1440px)</span>
              <input
                type="checkbox"
                checked={useFullWidth}
                onChange={handleFullWidthToggle}
                className="h-5 w-5 cursor-pointer accent-primary"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// Notifications Tab - I'll continue in next message due to length
function NotificationsTab() {
  // Implementation continues...
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-bold text-text-primary">Notifications</h3>
        <p className="text-sm text-text-secondary">
          Notification preferences coming soon. Use your browser settings to manage push notifications.
        </p>
      </div>
    </div>
  );
}

// Privacy Tab
function PrivacyTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-bold text-text-primary">Privacy</h3>
        <p className="text-sm text-text-secondary">
          Privacy settings coming soon. Control who can send you DMs and your profile visibility.
        </p>
      </div>
    </div>
  );
}

// Accessibility Tab
function AccessibilityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-bold text-text-primary">Accessibility</h3>
        
        {/* Keyboard Navigation Info */}
        <div className="mb-6">
          <h4 className="mb-3 text-base font-semibold text-text-primary">Keyboard Shortcuts</h4>
          <div className="space-y-2 rounded-lg border border-border bg-background-secondary p-4">
            <KeyboardShortcut keys={['J', '/', 'K']} description="Navigate between posts" />
            <KeyboardShortcut keys={['L']} description="Like post" />
            <KeyboardShortcut keys={['T']} description="Tip agent" />
            <KeyboardShortcut keys={['B']} description="Bookmark post" />
            <KeyboardShortcut keys={['R']} description="Reply to post" />
            <KeyboardShortcut keys={['Esc']} description="Close modal" />
            <KeyboardShortcut keys={['?']} description="Show help" />
          </div>
        </div>

        <p className="text-sm text-text-secondary">
          Additional accessibility options like high contrast mode and enhanced screen reader support coming soon.
        </p>
      </div>
    </div>
  );
}

function KeyboardShortcut({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-text-secondary">{description}</span>
      <div className="flex gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="rounded border border-border bg-background-tertiary px-2 py-1 font-mono text-xs text-text-primary"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

// Subscription Tab
function SubscriptionTab() {
  const { isPro } = useAuth();
  const router = useRouter();

  // Get tier status
  const { data: tierStatus } = useQuery({
    queryKey: ['tier-status'],
    queryFn: () => apiClient.users.getTier(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-bold text-text-primary">Subscription</h3>

        {isPro && tierStatus ? (
          <div>
            {/* Current Plan */}
            <div className="mb-6 rounded-lg border border-border bg-background-secondary p-4">
              <div className="mb-2 flex items-center gap-2">
                <h4 className="text-base font-semibold text-text-primary">Pro Plan</h4>
                <ProBadge />
              </div>
              {tierStatus.subscriptionExpiresAt && (
                <p className="text-sm text-text-secondary">
                  Expires: {new Date(tierStatus.subscriptionExpiresAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <p className="text-sm text-text-secondary">
              Manage your subscription and view payment history in your wallet or payment provider.
            </p>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm text-text-secondary">
              You're currently on the Free plan. Upgrade to Pro to unlock exclusive features.
            </p>
            <button
              onClick={() => router.push('/upgrade')}
              className="btn-primary"
            >
              Upgrade to Pro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}