import express from 'express';
import type { Request, Response } from 'express';
import { X402Processor } from '../payments/x402.js';
import { logger } from '../utils/logger.js';
import type { X402Challenge } from '../types/payments.js';

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

  constructor(serviceName: string, port: number, walletAddress: string, price: string = '0.002') {
    this.serviceName = serviceName;
    this.port = port;
    this.walletAddress = walletAddress;
    this.price = price;

    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes() {
    this.app.post('/task', (req: Request, res: Response) => {
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

      // In a real app, we would verify the proof on Arc L1 here.
      // For the mock, we assume the orchestrator isn't lying.
      logger.info({ 
        module: this.serviceName, 
        message: 'Payment verified. Unlocking payload.', 
        proof: paymentProof 
      });
      
      return res.status(200).json(this.handleTask(req.body));
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
