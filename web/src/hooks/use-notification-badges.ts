'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';

/**
 * Hook to manage notification badge count with real-time WebSocket updates
 * Integrates with API and WebSocket for notifications
 */
export function useNotificationCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { socket, isConnected } = useWebSocket();

  // Fetch initial count on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCount(0);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchCount = async () => {
      // Wait for the API client token to be set before making authenticated calls
      if (!apiClient.getToken()) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const response = await apiClient.notifications.getUnreadCount();
        if (isMounted) {
          setCount(response.count);
          setLoading(false);
        }
      } catch (error) {
        // Silently ignore auth errors — token may be stale or mid-refresh
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          if (isMounted) setLoading(false);
          return;
        }
        console.error('Failed to fetch notification count:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCount();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !isAuthenticated) return;

    // Increment count when new notification received
    const handleNotificationReceived = () => {
      setCount((prev) => prev + 1);
    };

    // Decrement count when notification is read
    const handleNotificationRead = () => {
      setCount((prev) => Math.max(0, prev - 1));
    };

    // Handle mark all as read
    const handleAllRead = () => {
      setCount(0);
    };

    socket.on('notification_received', handleNotificationReceived);
    socket.on('notification_read', handleNotificationRead);
    socket.on('notifications_all_read', handleAllRead);

    return () => {
      socket.off('notification_received', handleNotificationReceived);
      socket.off('notification_read', handleNotificationRead);
      socket.off('notifications_all_read', handleAllRead);
    };
  }, [socket, isConnected, isAuthenticated]);

  // Method to manually refresh count
  const refresh = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await apiClient.notifications.getUnreadCount();
      setCount(response.count);
    } catch (error) {
      console.error('Failed to refresh notification count:', error);
    }
  };

  // Method to mark as read
  const markAsRead = (decrementBy: number = 1) => {
    setCount((prev) => Math.max(0, prev - decrementBy));
  };

  // Method to mark all as read
  const markAllAsRead = () => {
    setCount(0);
  };

  return {
    count,
    loading,
    refresh,
    markAsRead,
    markAllAsRead,
  };
}

/**
 * Hook to manage message badge count with real-time WebSocket updates
 * Integrates with API and WebSocket for direct messages
 */
export function useMessageCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const { socket, isConnected } = useWebSocket();

  // Fetch initial count on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setCount(0);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchCount = async () => {
      if (!apiClient.getToken()) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        const response = await apiClient.messages.getUnreadCount();
        if (isMounted) {
          setCount(response.count);
          setLoading(false);
        }
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          if (isMounted) setLoading(false);
          return;
        }
        console.error('Failed to fetch message count:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCount();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  // Subscribe to WebSocket events for real-time updates
  useEffect(() => {
    if (!socket || !isConnected || !isAuthenticated || !user) return;

    // Increment count when new message received (only if recipient is current user)
    const handleNewMessage = (event: any) => {
      // Check if message is for current user
      // The event should have recipient_id or we can check conversation
      if (event.recipient_id === user.id || event.to_user_id === user.id) {
        setCount((prev) => prev + 1);
      }
    };

    // Decrement count when message is read
    const handleMessageRead = (event: any) => {
      // Only decrement if current user is the one who read it
      // Or if the conversation they're in had messages marked as read
      setCount((prev) => Math.max(0, prev - 1));
    };

    // Handle conversation marked as read (could have multiple messages)
    const handleConversationRead = (event: any) => {
      // Decrement by number of unread messages in that conversation
      // For simplicity, we refresh the count
      if (isAuthenticated && user) {
        apiClient.messages.getUnreadCount()
          .then((response) => setCount(response.count))
          .catch((error) => console.error('Failed to refresh message count:', error));
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('dm:new_message', handleNewMessage); // Alternative event name
    socket.on('message_read', handleMessageRead);
    socket.on('conversation_read', handleConversationRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('dm:new_message', handleNewMessage);
      socket.off('message_read', handleMessageRead);
      socket.off('conversation_read', handleConversationRead);
    };
  }, [socket, isConnected, isAuthenticated, user]);

  // Method to manually refresh count
  const refresh = async () => {
    if (!isAuthenticated || !user) return;

    try {
      const response = await apiClient.messages.getUnreadCount();
      setCount(response.count);
    } catch (error) {
      console.error('Failed to refresh message count:', error);
    }
  };

  // Method to mark conversation as read
  const markConversationAsRead = () => {
    // Refresh count since we don't know exact number
    refresh();
  };

  return {
    count,
    loading,
    refresh,
    markConversationAsRead,
  };
}