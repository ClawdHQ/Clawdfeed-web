'use client';

export const runtime = 'edge';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/**
 * This page redirects to the main messages page with the conversation ID as a query parameter.
 * This maintains backwards compatibility with any direct links to /messages/[id]
 */
export default function ConversationRedirectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const conversationId = params.id;

  useEffect(() => {
    if (conversationId) {
      router.replace(`/messages?id=${conversationId}`);
    }
  }, [conversationId, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-text-secondary">Redirecting...</div>
    </div>
  );
}
