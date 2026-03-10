'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { useHumanAuthStore, generateUsername, type HumanUser } from '@/stores/human-auth';
import { api } from '@/lib/api-client';

export function useHumanAuth() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const syncInProgress = useRef(false);

  const {
    user,
    accessToken,
    isLoading,
    error,
    _hasHydrated,
    setUser,
    setAccessToken,
    setLoading,
    setError,
    logout: storeLogout,
    isAuthenticated,
    isPro,
    canFollow,
  } = useHumanAuthStore();

  // Sync wallet user with our backend on login
  // Implements nonce-signature flow: request nonce -> sign -> sync (verify + consume + create user)
  const syncUserWithBackend = useCallback(async () => {
    if (!address || !isConnected) return;
    if (syncInProgress.current) return;
    syncInProgress.current = true;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Request nonce from backend
      // Backend generates a unique nonce with 5-minute expiry
      const nonceResponse = await api.nonce.request(address);
      const { nonce, message } = nonceResponse;

      // Step 2: Sign the nonce message with wallet
      // User must approve signature in wallet popup
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch (signError: any) {
        // Handle user rejection of signature
        if (signError?.code === 'ACTION_REJECTED' || signError?.message?.includes('User rejected')) {
          throw new Error('Signature required to authenticate. Please approve the signature request in your wallet.');
        }
        throw signError;
      }

      // Step 3: Sync user with backend
      // The sync endpoint verifies the nonce + signature, consumes the nonce,
      // upserts the user record, and returns a JWT access token.
      const response = await api.auth.syncHumanUser({
        walletAddress: address,
        linkedWallets: [address],
        signature,
        message,
      });

      // The API client auto-unwraps { success, data } responses, so
      // response is already the inner payload.
      // Note: the backend onSend hook converts all keys to snake_case,
      // so we read access_token, wallet_address, etc.
      const accessTokenValue = response.access_token;
      const userObj = response.user;

      if (userObj && accessTokenValue) {
        // Map tier to uppercase FREE/PRO (backend may return lowercase)
        let tier: 'FREE' | 'PRO' = 'FREE';
        const backendTier = (userObj.subscription_tier ?? '').toUpperCase();
        if (backendTier === 'PRO' || backendTier === 'FREE') {
          tier = backendTier as 'FREE' | 'PRO';
        }

        const userData: HumanUser = {
          id: userObj.id,
          username: userObj.username,
          displayName: userObj.display_name,
          email: userObj.email,
          avatarUrl: userObj.avatar_url,
          walletAddress: userObj.wallet_address,
          linkedWallets: userObj.linked_wallets || [],
          subscriptionTier: tier,
          subscriptionExpires: userObj.subscription_expires,
          followingCount: userObj.following_count || 0,
          maxFollowing: userObj.max_following || (tier === 'PRO' ? 999999 : 100),
          createdAt: userObj.created_at,
          isVerified: userObj.is_verified || false,
        };

        setUser(userData);
        setAccessToken(accessTokenValue);
        // Set token on API client for authenticated requests
        api.setToken(accessTokenValue);
      } else {
        throw new Error('Invalid response from server. Please try again.');
      }
    } catch (err: any) {
      console.error('Failed to sync user with backend:', err);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to authenticate';

      if (err?.message?.includes('Signature required')) {
        errorMessage = err.message;
      } else if (err?.message?.includes('nonce') || err?.message?.includes('expired')) {
        errorMessage = 'Authentication session expired. Please try again.';
      } else if (err?.message?.includes('verification failed')) {
        errorMessage = 'Signature verification failed. Please try again.';
      } else if (err?.code === 'NETWORK_ERROR' || err?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      syncInProgress.current = false;
    }
  }, [address, isConnected, signMessageAsync, setUser, setAccessToken, setLoading, setError]);

  // Initialize API client token from stored state on mount
  useEffect(() => {
    if (accessToken) {
      api.setToken(accessToken);
    } else {
      api.setToken(null);
    }
  }, [accessToken]);

  // Sync on wallet connection (wait for store hydration so we don't
  // trigger a redundant signature prompt when user data is still loading
  // from localStorage)
  useEffect(() => {
    if (_hasHydrated && isConnected && address && !user) {
      syncUserWithBackend();
    }
  }, [_hasHydrated, isConnected, address, user, syncUserWithBackend]);

  // Clear store on disconnect
  useEffect(() => {
    if (!isConnected && user) {
      storeLogout();
      api.setToken(null); // Clear token from API client
    }
  }, [isConnected, user, storeLogout]);

  const handleLogin = useCallback(() => {
    // RainbowKit handles wallet connection via ConnectButton component
  }, []);

  const handleLogout = useCallback(async () => {
    disconnect();
    storeLogout();
    api.setToken(null); // Clear token from API client
  }, [disconnect, storeLogout]);

  const updateProfile = useCallback(async (data: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
  }) => {
    if (!accessToken) return;

    try {
      // request() throws on error, so reaching here means success.
      // The response is auto-unwrapped (no success/data wrapper).
      await api.auth.updateHumanProfile(data, accessToken);
      setUser({
        ...user!,
        ...data,
      });
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  }, [accessToken, user, setUser]);

  return {
    // State
    user,
    accessToken,
    isLoading,
    error,
    walletAddress: address,
    connector,

    // Computed
    isAuthenticated: isAuthenticated(),
    isPro: isPro(),
    canFollow: canFollow(),
    isConnected,

    // Actions
    login: handleLogin,
    logout: handleLogout,
    updateProfile,
    syncUserWithBackend,
  };
}

// Hook for checking if user needs to login for a protected action
export function useRequireAuth() {
  const { isAuthenticated, login } = useHumanAuth();

  const requireAuth = useCallback((callback: () => void) => {
    if (isAuthenticated) {
      callback();
    } else {
      login();
    }
  }, [isAuthenticated, login]);

  return { requireAuth, isAuthenticated };
}