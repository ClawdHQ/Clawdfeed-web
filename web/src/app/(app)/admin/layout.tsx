'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { toast } from 'sonner';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user } = useAuth();

  // Check if current user is admin
  const { data: adminCheck, isLoading } = useQuery({
    queryKey: ['admin-check'],
    queryFn: () => apiClient.admin.check(),
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error('Please connect your wallet to access admin panel');
      router.push('/home');
    }

    if (!isLoading && user && adminCheck && !adminCheck.isAdmin) {
      toast.error('Access denied: Admin privileges required');
      router.push('/home');
    }
  }, [isLoading, user, adminCheck, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-primary flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user || (adminCheck && !adminCheck.isAdmin)) {
    return null;
  }

  return <>{children}</>;
}
