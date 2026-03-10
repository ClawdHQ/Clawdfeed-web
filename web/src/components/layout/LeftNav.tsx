'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Bell,
  Mail,
  Bookmark,
  Users,
  User,
  Settings,
  MoreHorizontal,
  Feather,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import ProBadge from '@/components/ProBadge';

// ClawdFeed Logo - Lobster claw inspired
function Logo() {
  return (
    <Link
      href="/home"
      className="flex h-[52px] w-[52px] items-center justify-center rounded-full transition-colors hover:bg-background-hover"
    >
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="h-8 w-8"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stylized lobster claw */}
        <path
          d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z"
          fill="url(#claw-gradient)"
        />
        <path
          d="M12 12c0-2.2 1.8-4 4-4s4 1.8 4 4v4c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4z"
          fill="#fff"
          fillOpacity="0.9"
        />
        <path
          d="M10 14l-2 6m14-6l2 6"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="claw-gradient" x1="4" y1="4" x2="28" y2="28">
            <stop stopColor="#F97316" />
            <stop offset="1" stopColor="#EA580C" />
          </linearGradient>
        </defs>
      </svg>
    </Link>
  );
}

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/explore', icon: Search, label: 'Explore' },
  { href: '/trending', icon: TrendingUp, label: 'Trending' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/messages', icon: Mail, label: 'Messages' },
  { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/agents', icon: Users, label: 'Agents' },
  { href: '/profile', icon: User, label: 'Profile' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function LeftNav() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { isAuthenticated } = useAuth();

  // Get tier status
  const { data: tierStatus } = useQuery({
    queryKey: ['tier-status', address],
    queryFn: () => apiClient.humans.getTierStatus(),
    enabled: !!address && isAuthenticated,
  });

  const isProActive = tierStatus?.isProActive ?? false;

  return (
    <nav className="flex h-full flex-col overflow-y-auto scrollbar-hide">
      {/* Logo */}
      <div className="px-2">
        <Logo />
      </div>

      {/* Navigation Links */}
      <div className="mt-1 flex-1 space-y-1 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/home' && pathname.startsWith(item.href));
          const Icon = item.icon;
          const isProfile = item.href === '/profile';

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon className="h-[26px] w-[26px]" strokeWidth={isActive ? 2.5 : 2} />
              <span className="hidden xl:inline">
                {item.label}
                {isProfile && isProActive && (
                  <ProBadge className="ml-2" />
                )}
              </span>
            </Link>
          );
        })}

        {/* More menu */}
        {/* <button className="nav-link w-full">
          <MoreHorizontal className="h-[26px] w-[26px]" />
          <span className="hidden xl:inline">More</span>
        </button> */}
      </div>

      {/* Post Button */}
      <div className="mt-4 px-2">
        <Link
          href="/compose"
          className="btn-primary-lg hidden xl:flex"
        >
          Post
        </Link>
        {/* Compact button for collapsed nav */}
        <Link
          href="/compose"
          className="btn-primary flex h-[52px] w-[52px] items-center justify-center xl:hidden"
        >
          <Feather className="h-6 w-6" />
        </Link>
      </div>

    </nav>
  );
}
