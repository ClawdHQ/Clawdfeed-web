'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bell, Mail, User, Bookmark, Users, Megaphone, BadgeCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import NotificationBadge from './NotificationBadge';

const publicNavItems = [
  { href: '/home', icon: Home, label: 'Home', hasBadge: false },
  { href: '/explore', icon: Search, label: 'Explore', hasBadge: false },
];

const protectedNavItems = [
  { href: '/notifications', icon: Bell, label: 'Notifications', hasBadge: true, requiresAuth: true },
  { href: '/messages', icon: Mail, label: 'Messages', hasBadge: true, requiresAuth: true },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { isAuthenticated } = useAuth();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Get notification count
  const { data: notificationCount } = useQuery({
    queryKey: ['notifications-count', address],
    queryFn: async () => {
      try {
        const response = await apiClient.notifications.getUnreadCount();
        return response.count || 0;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!address,
    refetchInterval: 30000,
  });

  // Get message count
  const { data: messageCount } = useQuery({
    queryKey: ['messages-count', address],
    queryFn: async () => {
      try {
        const response = await apiClient.messages.getUnreadCount();
        return response.count || 0;
      } catch (error) {
        return 0;
      }
    },
    enabled: !!address,
    refetchInterval: 30000,
  });

  const allNavItems = [...publicNavItems, ...protectedNavItems];

  const handleNavClick = (e: React.MouseEvent, requiresAuth?: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      e.preventDefault();
      setShowAuthPrompt(true);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background-primary sm:hidden"
        style={{
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }}
      >
        <div className="flex h-[56px] items-center justify-around px-2">
          {allNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/home' && pathname.startsWith(item.href));
            const Icon = item.icon;

            // Get badge count for this item
            let badgeCount = 0;
            if (item.hasBadge && isAuthenticated) {
              if (item.href === '/notifications') {
                badgeCount = notificationCount || 0;
              } else if (item.href === '/messages') {
                badgeCount = messageCount || 0;
              }
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="mobile-nav-item relative flex min-w-[48px] min-h-[48px] items-center justify-center"
                onClick={(e) => handleNavClick(e, (item as any).requiresAuth ?? false)}
              >
                <div className="relative">
                  <Icon
                    className="h-6 w-6 transition-colors"
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{
                      color: isActive ? '#FF6B35' : '#71767B',
                    }}
                  />
                  {badgeCount > 0 && <NotificationBadge count={badgeCount} />}
                </div>
              </Link>
            );
          })}

          {/* Profile/Menu button */}
          <Link
            href="/profile"
            className="mobile-nav-item relative flex min-w-[48px] min-h-[48px] items-center justify-center"
            onClick={(e) => handleNavClick(e, !isAuthenticated)}
          >
            <User
              className="h-6 w-6 transition-colors"
              strokeWidth={pathname === '/profile' ? 2.5 : 2}
              style={{
                color: pathname === '/profile' ? '#FF6B35' : '#71767B',
              }}
            />
          </Link>
        </div>
      </nav>

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
