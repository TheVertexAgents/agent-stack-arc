import type { X402Challenge } from '../types/payments.js';

/**
 * @title X402 Utility
 * @dev Handles parsing and formatting of x402 HTTP headers.
 * Standard: x402-payment-request: <invoice_id>:<amount>:<dest_wallet>
 */
export class X402Processor {
  private static HEADER_NAME = 'x402-payment-request';

  /**
   * @dev Formats a challenge into the standard header string.
   */
  static formatHeader(challenge: X402Challenge): string {
    return `${challenge.invoiceId}:${challenge.amount}:${challenge.destinationWallet}`;
  }

  /**
   * @dev Parses a header string into a challenge object.
   */
  static parseHeader(headerValue: string): X402Challenge {
    const [invoiceId, amount, destinationWallet] = headerValue.split(':');
    
    if (!invoiceId || !amount || !destinationWallet) {
      throw new Error('Invalid x402 header format');
    }

    return {
      invoiceId,
      amount,
      destinationWallet,
      token: 'USDC'
    };
  }

  /**
   * @dev Helper to get the header name constant.
   */
  static getHeaderName(): string {
    return this.HEADER_NAME;
  }
}
