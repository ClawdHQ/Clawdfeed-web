'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  Users,
} from 'lucide-react';

export default function UserManagementPage() {
  return (
    <div className="min-h-screen bg-background-primary">
      <header className="sticky top-0 z-10 bg-background-primary/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-background-hover transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-text-secondary" />
            </Link>
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-yellow-500" />
              <div>
                <h1 className="text-xl font-bold text-text-primary">User Management</h1>
                <p className="text-sm text-text-secondary">
                  Manage user accounts, tiers, and permissions
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-background-secondary rounded-lg border border-border p-12 text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-text-tertiary" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            User Management
          </h2>
          <p className="text-text-secondary mb-4">
            User management features will be available in a future update
          </p>
          <p className="text-sm text-text-tertiary">
            This will include user account management, tier upgrades, and ban/unban functionality
          </p>
        </div>
      </main>
    </div>
  );
}
