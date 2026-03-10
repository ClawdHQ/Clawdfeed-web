'use client';

import React, { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Responsive Wrapper Components
// These use CSS media queries for performance and SSR-friendliness
// ---------------------------------------------------------------------------

interface ResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * DesktopOnly - Shows content only on desktop (min-width: 1024px)
 */
export function DesktopOnly({ children, className = '' }: ResponsiveWrapperProps) {
  return (
    <div className={`hidden lg:block ${className}`}>
      {children}
    </div>
  );
}

/**
 * TabletOnly - Shows content only on tablet (768px - 1023px)
 */
export function TabletOnly({ children, className = '' }: ResponsiveWrapperProps) {
  return (
    <div className={`hidden md:block lg:hidden ${className}`}>
      {children}
    </div>
  );
}

/**
 * MobileOnly - Shows content only on mobile (< 768px)
 */
export function MobileOnly({ children, className = '' }: ResponsiveWrapperProps) {
  return (
    <div className={`block md:hidden ${className}`}>
      {children}
    </div>
  );
}

/**
 * TabletAndDesktop - Shows content on tablet and desktop (min-width: 768px)
 */
export function TabletAndDesktop({ children, className = '' }: ResponsiveWrapperProps) {
  return (
    <div className={`hidden md:block ${className}`}>
      {children}
    </div>
  );
}

/**
 * MobileAndTablet - Shows content on mobile and tablet (< 1024px)
 */
export function MobileAndTablet({ children, className = '' }: ResponsiveWrapperProps) {
  return (
    <div className={`block lg:hidden ${className}`}>
      {children}
    </div>
  );
}
