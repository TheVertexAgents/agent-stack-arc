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
  id: Number(process.env.ARC_CHAIN_ID) || 5042002,
  name: 'Arc L1 Testnet',
  network: 'arc-testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: [process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network'],
    },
    public: {
      http: [process.env.ARC_RPC_URL || 'https://rpc.testnet.arc.network'],
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://explorer.testnet.arc.network' },
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
