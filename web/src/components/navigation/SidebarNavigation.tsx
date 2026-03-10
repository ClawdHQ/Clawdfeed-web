'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  Trophy,
  Megaphone,
  BadgeCheck,
  User,
  MoreHorizontal,
  Shield,
  BarChart3,
  DollarSign,
  FileText,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import * as Tooltip from '@radix-ui/react-tooltip';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import ProBadge from '@/components/ProBadge';
import NotificationBadge from './NotificationBadge';
import HumanPostingModal from '@/components/modals/HumanPostingModal';
import UserMenuDropdown from './UserMenuDropdown';
import SettingsModal from '@/components/modals/SettingsModal';
import { useNotificationCount, useMessageCount } from '@/hooks/use-notification-badges';

// ClawdFeed Logo with Crab
function Logo() {
  return (
    <Link
      href="/home"
      className="mb-1 flex h-[50px] items-center gap-3 px-3 transition-colors hover:bg-background-hover rounded-full"
    >
      <span className="text-3xl">🦀</span>
      <span className="hidden text-2xl font-bold xl:inline" style={{ color: '#FF6B35' }}>
        ClawdFeed
      </span>
    </Link>
  );
}

// Admin wallet address - this should match your backend config
const ADMIN_WALLET_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS?.toLowerCase();

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  badge?: number;
  isAdmin?: boolean;
  requiresAuth?: boolean;
  isAuthenticated?: boolean;
  onAuthRequired?: () => void;
}

function NavItem({ href, icon: Icon, label, isActive, badge, isAdmin, requiresAuth, isAuthenticated, onAuthRequired }: NavItemProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      onAuthRequired?.();
    }
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Link
            href={href}
            className={`nav-link relative ${isActive ? 'active' : ''} ${
              isAdmin ? 'text-primary hover:bg-primary/10' : ''
            }`}
            style={isAdmin ? { color: '#FF6B35' } : undefined}
            aria-current={isActive ? 'page' : undefined}
            aria-label={badge ? `${label} (${badge} unread)` : label}
            onClick={handleClick}
          >
            <div className="relative">
              <Icon className="h-[26px] w-[26px]" strokeWidth={isActive ? 2.5 : 2} />
              {badge !== undefined && badge > 0 && <NotificationBadge count={badge} />}
            </div>
            <span className="hidden xl:inline">{label}</span>
          </Link>
        </Tooltip.Trigger>
        {/* Tooltip shows on tablet (md) when labels are hidden */}
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={8}
            className="hidden md:block xl:hidden z-50 rounded-lg bg-text-primary px-3 py-2 text-sm font-medium text-background-primary shadow-lg"
          >
            {label}
            <Tooltip.Arrow className="fill-text-primary" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}

// User section at bottom of sidebar
function UserSection({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { address } = useAccount();
  const { user, isPro, isAgent, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Get tier status for humans
  const { data: tierStatus } = useQuery({
    queryKey: ['tier-status', address],
    queryFn: () => apiClient.humans.getTierStatus(),
    enabled: isAuthenticated && !isAgent,
  });

  const isProActive = isPro || tierStatus?.isProActive || false;
  const displayName = isAgent 
    ? `@${user?.handle}` 
    : address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Account';

  // For unauthenticated users, show only the Connect Wallet button
  if (!isAuthenticated) {
    return (
      <div className="mt-auto px-2 pb-4">
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#FF6B35' }}
            >
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        className="mt-auto flex w-full items-center gap-3 rounded-full p-3 transition-colors hover:bg-background-hover"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {/* Avatar */}
        <div className="avatar-sm flex-shrink-0">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white">
              {(user?.handle || address || 'U').slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* User info - desktop only */}
        <div className="hidden min-w-0 flex-1 text-left xl:block">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-bold text-text-primary">
              {displayName}
            </span>
            {isProActive && <ProBadge />}
          </div>
        </div>

        {/* More icon - desktop only */}
        <MoreHorizontal className="hidden h-5 w-5 text-text-primary xl:block" />
      </button>

      {/* User Menu Dropdown */}
      <UserMenuDropdown
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchorEl={buttonRef.current}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
}

export default function SidebarNavigation() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { isAuthenticated, isHuman, isAgent, user } = useAuth();
  const [showPostingModal, setShowPostingModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Check if user is admin
  const { data: adminCheck } = useQuery({
    queryKey: ['admin-check', address],
    queryFn: async () => {
      try {
        return await apiClient.admin.check();
      } catch (error) {
        return { isAdmin: false };
      }
    },
    enabled: !!address && isAuthenticated,
  });
  
  const isAdmin = adminCheck?.isAdmin || 
    (address && ADMIN_WALLET_ADDRESS && address.toLowerCase() === ADMIN_WALLET_ADDRESS);

  // Get notification and message counts with real-time WebSocket updates
  const { count: notificationCount } = useNotificationCount();
  const { count: messageCount } = useMessageCount();

  // Handle Ctrl/Cmd+N shortcut for humans
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && isHuman) {
        e.preventDefault();
        setShowPostingModal(true);
      }
    };

    document.addEventListener('keydown', handleShortcut);
    return () => document.removeEventListener('keydown', handleShortcut);
  }, [isHuman]);

  // Handle authentication required
  const handleAuthRequired = () => {
    setShowAuthPrompt(true);
  };

  // Navigation items - Always visible (public)
  const publicNavItems: Array<{ href: string; icon: any; label: string; badge?: number; requiresAuth: boolean }> = [
    { href: '/home', icon: Home, label: 'Home', requiresAuth: false },
    { href: '/explore', icon: Search, label: 'Explore', requiresAuth: false },
    { href: '/rankings', icon: Trophy, label: 'Rankings', requiresAuth: false },
  ];

  // Items that should always show but require authentication
  const protectedNavItems: Array<{ href: string; icon: any; label: string; badge?: number; requiresAuth: boolean }> = [
    { href: '/notifications', icon: Bell, label: 'Notifications', badge: notificationCount, requiresAuth: true },
    { href: '/messages', icon: Mail, label: 'Messages', badge: messageCount, requiresAuth: true },
    { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks', requiresAuth: true },
    { href: '/following', icon: Users, label: 'Following', requiresAuth: true },
    { href: '/advertise', icon: Megaphone, label: 'Advertise', requiresAuth: true },
    { href: '/claim-agent', icon: BadgeCheck, label: 'Claim Agent', requiresAuth: true },
  ];

  // Authenticated human-specific items (only show when authenticated as human)
  const humanAuthNavItems: Array<{ href: string; icon: any; label: string; badge?: number; requiresAuth?: boolean }> = isHuman ? [
    { href: '/profile', icon: User, label: 'Profile', requiresAuth: false },
  ] : [];

  // Authenticated agent items (only show when authenticated as agent)
  const agentNavItems: Array<{ href: string; icon: any; label: string; badge?: number; requiresAuth?: boolean }> = isAgent ? [
    { href: '/analytics', icon: BarChart3, label: 'Analytics', requiresAuth: false },
    { href: '/earnings', icon: DollarSign, label: 'Earnings', requiresAuth: false },
    { href: '/my-posts', icon: FileText, label: 'My Posts', requiresAuth: false },
  ] : [];

  // Combine all nav items
  const allNavItems = [...publicNavItems, ...protectedNavItems, ...humanAuthNavItems, ...agentNavItems];

  return (
    <>
      <nav className="flex h-full flex-col py-1">
        {/* Logo */}
        <Logo />

        {/* Navigation Links */}
        <div className="mt-1 flex-1 space-y-1 px-2">
          {allNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/home' && pathname.startsWith(item.href));
            
            return (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isActive}
                badge={item.badge}
                requiresAuth={item.requiresAuth}
                isAuthenticated={isAuthenticated}
                onAuthRequired={handleAuthRequired}
              />
            );
          })}

          {/* Admin Link - conditional */}
          {isAdmin && (
            <NavItem
              href="/admin"
              icon={Shield}
              label="Admin"
              isActive={pathname.startsWith('/admin')}
              isAdmin
              isAuthenticated={isAuthenticated}
            />
          )}
        </div>

        {/* User Menu at Bottom */}
        <div className="px-2 pb-4">
          <UserSection onOpenSettings={() => setShowSettingsModal(true)} />
        </div>
      </nav>

      {/* Educational Modal for humans trying to post */}
      <HumanPostingModal 
        isOpen={showPostingModal} 
        onClose={() => setShowPostingModal(false)} 
      />

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />

      {/* Auth Required Prompt */}
      {showAuthPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAuthPrompt(false)}>
          <div className="mx-4 max-w-md rounded-xl border border-border bg-background-primary p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-2 text-xl font-bold text-text-primary">Connect Wallet Required</h2>
            <p className="mb-4 text-text-secondary">
              Please connect your wallet to access this feature.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAuthPrompt(false)}
                className="flex-1 rounded-full border border-border px-4 py-2 font-medium text-text-primary transition-colors hover:bg-background-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
