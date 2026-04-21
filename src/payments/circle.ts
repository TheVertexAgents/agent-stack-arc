import { logger } from '../utils/logger.js';
import { initiateDeveloperControlledWalletsClient } from '@circle-fin/developer-controlled-wallets';
import { parseUnits } from 'viem';
import dotenv from 'dotenv';

dotenv.config();

/**
 * @title Circle Nanopayments API Client
 * @dev Logic for triggering off-chain nanopayment instructions that settle on Arc L1.
 */
export class CirclePayments {
  private static API_BASE = 'https://api-sandbox.circle.com/v1/nanopayments';

  /**
   * @dev Dispatches a nanopayment.
   */
  static async sendPayment(params: {
    destinationWallet: string;
    amount: string;
    invoiceId: string;
  }) {
    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      logger.warn({ module: 'CirclePayments', message: 'No CIRCLE_API_KEY found - skipping real payment' });
      return `0x_sim_tx_${Math.random().toString(36).substring(7)}`;
    }

    try {
      logger.info({ 
        module: 'CirclePayments', 
        message: 'Dispatching Circle Nanopayment', 
        invoice: params.invoiceId,
        amount: params.amount 
      });

      const walletId = process.env.ORCHESTRATOR_WALLET_ID;
      const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
      
      if (!walletId || !entitySecret) throw new Error('Missing ORCHESTRATOR_WALLET_ID or CIRCLE_ENTITY_SECRET');

      const client = initiateDeveloperControlledWalletsClient({
        apiKey,
        entitySecret,
        baseUrl: "https://api.circle.com" // Sandbox is routed through API key on WaaS
      });
      
      // Developer-Controlled Wallet Transaction
      const response = await client.createTransaction({
        walletId: walletId,
        destinationAddress: params.destinationWallet,
        amounts: [params.amount],
        fee: {
          type: "level",
          config: {
            feeLevel: "MEDIUM"
          }
        },
        tokenAddress: process.env.USDC_CONTRACT_ADDRESS || "0x3600000000000000000000000000000000000000",
        blockchain: "ARC-TESTNET"
      });

      const txId = response.data?.id;
      let txHash = null;
      let attempts = 0;
      
      while (attempts < 10) {
        await new Promise(r => setTimeout(r, 2000));
        const txStatus = await client.getTransaction({ id: txId as string });
        if (txStatus.data?.transaction?.txHash) {
          txHash = txStatus.data.transaction.txHash;
          break;
        }
        if (txStatus.data?.transaction?.state === "FAILED") {
          throw new Error("Circle transaction failed: " + txStatus.data.transaction.errorReason);
        }
        attempts++;
      }

      if (!txHash) {
        throw new Error("Timeout waiting for Circle transaction hash");
      }

      logger.info({ 
        module: 'CirclePayments', 
        message: 'Arc L1 Nanopayment Settled', 
        txHash,
        invoice: params.invoiceId 
      });

      return txHash;
    } catch (error: any) {
      logger.error({ 
        module: 'CirclePayments', 
        message: 'Nanopayment dispatch failed', 
        error: error.response ? error.response.data : error.message 
      });
      throw error;
    }
  }
}
