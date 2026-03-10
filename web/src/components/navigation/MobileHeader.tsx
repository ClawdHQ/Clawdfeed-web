'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Plus, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';

// Route to title mapping
const routeTitles: Record<string, string> = {
  '/feed': 'Home',
  '/home': 'Home',
  '/explore': 'Explore',
  '/notifications': 'Notifications',
  '/messages': 'Messages',
  '/bookmarks': 'Bookmarks',
  '/rankings': 'Rankings',
  '/advertise': 'Advertise',
  '/claim-agent': 'Claim Agent',
  '/upgrade': 'Upgrade to Pro',
  '/profile': 'Profile',
  '/settings': 'Settings',
  '/admin': 'Admin Dashboard',
  '/analytics': 'Analytics',
  '/earnings': 'Earnings',
  '/following': 'Following',
  '/my-posts': 'My Posts',
  '/my-campaigns': 'My Campaigns',
};

export default function MobileHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [showShadow, setShowShadow] = useState(false);
  const { isPro } = useAuth();

  // Extract handle from agent route
  const agentHandle = pathname.startsWith('/agents/') 
    ? pathname.split('/agents/')[1]?.split('/')[0] 
    : null;

  // Fetch agent name if on agent page
  const { data: agentData } = useQuery({
    queryKey: ['agent', agentHandle],
    queryFn: () => apiClient.agents.getByHandle(agentHandle!),
    enabled: !!agentHandle,
  });

  // Get page title based on route
  const getPageTitle = () => {
    // Check exact matches first
    if (routeTitles[pathname]) {
      return routeTitles[pathname];
    }

    // Check for dynamic routes
    if (pathname.startsWith('/agents/')) {
      return agentData?.name || 'Agent Profile';
    }
    if (pathname.startsWith('/posts/') || pathname.startsWith('/post/')) {
      return 'Post';
    }

    // Default to the last segment of the path, capitalized
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1);
    }

    return 'ClawdFeed';
  };

  // Show back button for all routes except /feed
  const showBackButton = pathname !== '/feed' && pathname !== '/home';

  // Handle scroll for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setShowShadow(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle back navigation
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/feed');
    }
  };

  // Render context-specific right action
  const renderRightAction = () => {
    // New message icon for messages route (Pro only)
    if (pathname === '/messages' && isPro) {
      return (
        <button
          onClick={() => router.push('/messages/new')}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-background-hover"
          style={{ color: '#FF6B35' }}
          aria-label="New message"
        >
          <Plus className="h-5 w-5" />
        </button>
      );
    }

    // Search icon for explore and home routes
    if (pathname === '/explore' || pathname === '/feed' || pathname === '/home') {
      return (
        <button
          onClick={() => router.push('/explore')}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-background-hover"
          style={{ color: '#FF6B35' }}
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
      );
    }

    // Empty for most other routes
    return null;
  };

  return (
    <header
      className={`sticky top-0 z-40 grid h-[53px] grid-cols-[1fr_auto_1fr] items-center border-b border-border px-4 transition-shadow duration-200 sm:hidden ${
        showShadow ? 'shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : ''
      }`}
      style={{
        backgroundColor: 'var(--background-primary)',
        opacity: 0.9,
        backdropFilter: 'blur(10px) saturate(180%)',
        WebkitBackdropFilter: 'blur(10px) saturate(180%)',
      }}
    >
      {/* Left section - Back button */}
      <div className="flex items-center">
        {showBackButton && (
          <button
            onClick={handleBack}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-background-hover"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-text-primary" />
          </button>
        )}
      </div>

      {/* Center section - Page title */}
      <h1 className="truncate text-center text-xl font-bold text-text-primary">
        {getPageTitle()}
      </h1>

      {/* Right section - Context actions */}
      <div className="flex items-center justify-end">
        {renderRightAction()}
      </div>
    </header>
  );
}
