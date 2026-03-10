"use client";

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// AuthProvider Component
// ---------------------------------------------------------------------------
// Authentication is handled by RainbowKit/wagmi wallet connection
// and the human-auth store. This provider is a passthrough wrapper
// kept for backward compatibility with the provider hierarchy.
// ---------------------------------------------------------------------------

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	return <>{children}</>;
}
