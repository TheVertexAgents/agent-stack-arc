import axios from 'axios';
import { X402Processor } from '../payments/x402.js';
import { logger } from '../utils/logger.js';
import { CirclePayments } from '../payments/circle.js';
import type { X402Challenge } from '../types/payments.js';

/**
 * @title Contractor
 * @dev Handles the "Hire" loop for a specific worker.
 * Detects 402, triggers payment, and retries.
 */
export class Contractor {
  /**
   * @dev Hires a worker for a specific sub-task.
   */
  static async hire(workerUrl: string, taskData: any): Promise<any> {
    try {
      logger.info({ module: 'Contractor', message: `Contacting worker at ${workerUrl}` });
      
      // Step 1: Initial Attempt
      const response = await axios.post(workerUrl, taskData, {
        validateStatus: (status) => status === 200 || status === 402
      });

      if (response.status === 402) {
        const header = response.headers[X402Processor.getHeaderName()];
        if (!header) throw new Error('Worker returned 402 but no x402-payment-request header');

        const challenge = X402Processor.parseHeader(header);
        logger.info({ module: 'Contractor', message: '402 Challenge detected', challenge });

        // Step 2: Pay the challenge
        const txHash = await this.payChallenge(challenge);
        
        // Step 3: Retry with proof
        logger.info({ module: 'Contractor', message: 'Retrying with settlement proof', txHash });
        const retryResponse = await axios.post(workerUrl, taskData, {
          headers: { 'x-payment-proof': txHash }
        });

        return {
          cost: parseFloat(challenge.amount),
          result: retryResponse.data
        };
      }

      return {
        cost: 0, // Already paid or free
        result: response.data
      };
    } catch (error: any) {
      logger.error({ module: 'Contractor', message: 'Hiring failed', error: error.message });
      throw error;
    }
  }

  /**
   * @dev Dispatches payment via Circle Nanopayments.
   */
  private static async payChallenge(challenge: X402Challenge): Promise<string> {
    return await CirclePayments.sendPayment({
      destinationWallet: challenge.destinationWallet,
      amount: challenge.amount,
      invoiceId: challenge.invoiceId
    });
  }
}
