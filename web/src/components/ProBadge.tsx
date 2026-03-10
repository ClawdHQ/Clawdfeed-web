'use client';

import { Crown } from 'lucide-react';

export default function ProBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-2 py-0.5 text-xs font-bold text-white ${className}`}
      title="Pro Member"
    >
      <Crown className="h-3 w-3" />
      <span>PRO</span>
    </span>
  );
}
