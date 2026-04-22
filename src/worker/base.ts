import express from 'express';
import type { Request, Response } from 'express';
import { X402Processor } from '../payments/x402.js';
import { logger } from '../utils/logger.js';
import type { X402Challenge } from '../types/payments.js';
import { publicClient } from '../arc/client.js';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * @title AbstractWorker
 * @dev Base class for x402-enabled sub-agents.
 */
export abstract class AbstractWorker {
  protected app = express();
  protected port: number;
  protected serviceName: string;
  protected walletAddress: string;
  protected price: string;

  constructor(serviceName: string, port: number, addressOrKey: string, price: string = '0.002') {
    this.serviceName = serviceName;
    this.port = port;
    this.price = price;

    if (addressOrKey.length === 64 || (addressOrKey.startsWith('0x') && addressOrKey.length === 66)) {
      const account = privateKeyToAccount(addressOrKey.startsWith('0x') ? addressOrKey as `0x${string}` : `0x${addressOrKey}`);
      this.walletAddress = account.address;
    } else {
      this.walletAddress = addressOrKey;
    }

    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes() {
    // Readiness probe for stress test poller
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({ status: 'ok', service: this.serviceName });
    });

    this.app.post('/task', async (req: Request, res: Response) => {
      const paymentProof = req.header('x-payment-proof');

      if (!paymentProof) {
        const challenge: X402Challenge = {
          invoiceId: `inv_${Math.random().toString(36).substring(2, 9)}`,
          amount: this.price,
          destinationWallet: this.walletAddress,
          token: 'USDC'
        };

        logger.info({ 
          module: this.serviceName, 
          message: 'Issuing 402 Challenge', 
          invoiceId: challenge.invoiceId 
        });

        res.setHeader(X402Processor.getHeaderName(), X402Processor.formatHeader(challenge));
        return res.status(402).json({ 
          error: 'Payment Required', 
          challenge 
        });
      }

      // Real Arc L1 Verification with wait for mining
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: paymentProof as `0x${string}`,
          timeout: 10000 
        });

        if (receipt.status !== 'success') {
          throw new Error('Payment transaction failed on-chain');
        }

        logger.info({ 
          module: this.serviceName, 
          message: 'Payment verified on Arc L1. Unlocking payload.', 
          proof: paymentProof 
        });
        
        return res.status(200).json(this.handleTask(req.body));
      } catch (error: any) {
        logger.warn({ 
          module: this.serviceName, 
          message: 'Payment verification failed', 
          error: error.message 
        });
        return res.status(402).json({ error: 'Payment verification failed. Please check tx hash.' });
      }
    });
  }

  protected abstract handleTask(input: any): any;

  public start() {
    this.app.listen(this.port, () => {
      logger.info({ 
        module: this.serviceName, 
        message: `Worker live on port ${this.port}`,
        wallet: this.walletAddress
      });
    });
  }
}
