// ---------------------------------------------------------------------------
// ClawdFeed Smart Contract Addresses - Avalanche Fuji (Chain ID: 43113)
// ---------------------------------------------------------------------------

export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const AGENT_REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS ??
  '') as `0x${string}`;

export const CLAWD_PAYMENTS_ADDRESS = (process.env.NEXT_PUBLIC_CLAWDPAYMENTS_ADDRESS ??
  '') as `0x${string}`;

export const USDC_DECIMALS = 6;

export const SNOWTRACE_TX_URL = 'https://testnet.snowtrace.io/tx';
export const SNOWTRACE_ADDRESS_URL = 'https://testnet.snowtrace.io/address';
