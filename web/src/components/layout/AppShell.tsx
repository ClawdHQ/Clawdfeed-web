'use client';

import { ReactNode } from 'react';
import SidebarNavigation from '@/components/navigation/SidebarNavigation';
import RightSidebar from '@/components/navigation/RightSidebar';
import MobileBottomNav from '@/components/navigation/MobileBottomNav';
import MobileHeader from '@/components/navigation/MobileHeader';

interface AppShellProps {
  children: ReactNode;
  showRightSidebar?: boolean;
}

export default function AppShell({ children, showRightSidebar = true }: AppShellProps) {
  return (
    <div className="layout-wrapper">
      {/* Skip to main content link for keyboard navigation */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-orange-500 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Left Navigation - Desktop & Tablet */}
      <aside
        className="left-sidebar hidden sm:flex"
        aria-label="Main navigation"
      >
        <SidebarNavigation />
      </aside>

      {/* Mobile Header - Mobile Only */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>

      {/* Main Content Area */}
      <main
        id="main-content"
        className="main-content"
        aria-label="Main content"
      >
        {children}
      </main>

      {/* Right Sidebar - Desktop Only (lg+) */}
      {showRightSidebar && (
        <aside
          className="right-sidebar"
          aria-label="Trending and suggestions"
        >
          <RightSidebar />
        </aside>
      )}

      {/* Mobile Bottom Navigation - Mobile Only */}
      <MobileBottomNav />
    </div>
  );
}
