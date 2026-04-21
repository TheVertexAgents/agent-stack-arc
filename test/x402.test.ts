import type { X402Challenge } from '../src/types/payments.js';
import { X402Processor } from '../src/payments/x402.js';

async function runTests() {
  console.log('Running tests for X402Processor...');

  const mockChallenge: X402Challenge = {
    invoiceId: 'inv_12345',
    amount: '0.002',
    destinationWallet: '0x1234567890123456789012345678901234567890',
    token: 'USDC'
  };

  const expectedHeader = 'inv_12345:0.002:0x1234567890123456789012345678901234567890';

  // Test 1: Formatting
  const header = X402Processor.formatHeader(mockChallenge);
  if (header !== expectedHeader) {
    throw new Error(`Test 1 Failed: Expected ${expectedHeader}, got ${header}`);
  }
  console.log('✅ Formatting test passed');

  // Test 2: Parsing
  const challenge = X402Processor.parseHeader(expectedHeader);
  if (challenge.invoiceId !== mockChallenge.invoiceId) throw new Error('Test 2 Failed: Mismatched invoiceId');
  if (challenge.amount !== mockChallenge.amount) throw new Error('Test 2 Failed: Mismatched amount');
  if (challenge.destinationWallet !== mockChallenge.destinationWallet) throw new Error('Test 2 Failed: Mismatched wallet');
  console.log('✅ Parsing test passed');

  // Test 3: Invalid Header
  try {
    X402Processor.parseHeader('invalid:format');
    throw new Error('Test 3 Failed: Should have thrown');
  } catch (e: any) {
    if (e.message !== 'Invalid x402 header format') throw e;
  }
  console.log('✅ Invalid format test passed');

  console.log('🚀 All tests passed');
}

runTests().catch(err => {
  console.error('❌ Tests failed:', err.message);
  process.exit(1);
});
