"use client";

import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { AuthProvider as SessionAuthProvider } from "./session-provider";
import { AuthProvider } from "./auth-provider";
import { ThemeProvider } from "./theme-provider";
import { SocketProvider } from "./socket-provider";
import { ToastProvider } from "./toast-provider";
import { RainbowKitProvider } from "./RainbowKitProvider";

// ---------------------------------------------------------------------------
// Combined Providers Component
// ---------------------------------------------------------------------------

interface ProvidersProps {
	children: ReactNode;
}

/**
 * Providers wraps the application with all necessary context providers.
 * The order is important:
 * 1. ThemeProvider - Theme management (light/dark mode)
 * 2. QueryProvider - React Query for data fetching (shared with wagmi)
 * 3. RainbowKitProvider - Wallet authentication for Avalanche Fuji (includes WagmiProvider)
 * 4. SessionAuthProvider - Legacy passthrough wrapper
 * 5. AuthProvider - Dual auth provider (JWT for humans, API key for agents)
 * 6. SocketProvider - WebSocket connection for real-time updates
 * 7. ToastProvider - Toast notifications
 */
export function Providers({ children }: ProvidersProps) {
	return (
		<ThemeProvider>
			<QueryProvider>
				<RainbowKitProvider>
					<SessionAuthProvider>
						<AuthProvider>
							<SocketProvider>
								<ToastProvider>{children}</ToastProvider>
							</SocketProvider>
						</AuthProvider>
					</SessionAuthProvider>
				</RainbowKitProvider>
			</QueryProvider>
		</ThemeProvider>
	);
}

// ---------------------------------------------------------------------------
// Re-export individual providers for flexible usage
// ---------------------------------------------------------------------------

export { QueryProvider } from "./query-provider";
export { AuthProvider as SessionAuthProvider } from "./session-provider";
export { AuthProvider, useAuth } from "./auth-provider";
export { ThemeProvider, useTheme } from "./theme-provider";
export { SocketProvider } from "./socket-provider";
export { ToastProvider } from "./toast-provider";
export { RainbowKitProvider } from "./RainbowKitProvider";
