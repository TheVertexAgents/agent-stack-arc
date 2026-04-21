import { createPublicClient, createWalletClient, http, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * @title Arc L1 Network
 * @dev Custom chain definition for Arc L1.
 * Arc is an EVM-compatible L1 from Circle.
 * USDC is the native gas token.
 */
export const arcChain = defineChain({
  id: 2501, // Mock/Placeholder Chain ID for Arc Devnet - verify during Phase 3
  name: 'Arc L1 Devnet',
  network: 'arc-devnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.arc-l1.circle.com'],
    },
    public: {
      http: ['https://rpc.arc-l1.circle.com'],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://explorer.arc-l1.circle.com' },
  },
});

export const publicClient = createPublicClient({
  chain: arcChain,
  transport: http(),
});

/**
 * @dev Helper to get a wallet client for a private key.
 */
export function getWalletClient(privateKey: string) {
  if (!privateKey) throw new Error('Private key is required');
  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}` as `0x${string}`);
  
  return createWalletClient({
    account,
    chain: arcChain,
    transport: http(),
  });
}

logger.info({ module: 'ArcClient', message: 'Arc L1 Viem clients initialized' });
