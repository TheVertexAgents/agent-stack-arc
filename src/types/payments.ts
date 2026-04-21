export interface X402Challenge {
  invoiceId: string;
  amount: string; // USDC amount (e.g. "0.002")
  destinationWallet: string;
  token: 'USDC';
}

export interface PaymentProof {
  txHash: string;
  invoiceId: string;
  walletAddress: string;
}

/**
 * @dev Service response wrapper for x402
 */
export type X402Response<T> = 
  | { status: 402; challenge: X402Challenge }
  | { status: 200; data: T };
