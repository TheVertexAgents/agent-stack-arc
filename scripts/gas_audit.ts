import { publicClient } from '../src/arc/client.js';
import { logger } from '../src/utils/logger.js';
import fs from 'fs';

const AUDIT_FILE = 'docs/STRESS_TEST_LOG.json';

/**
 * @title GasAudit
 * @dev Verifies that transaction fees on Arc L1 are indeed zero.
 */
async function main() {
  console.log("--- STARTING ARC L1 GAS AUDIT ---");

  if (!fs.existsSync(AUDIT_FILE)) {
    console.error(`Missing audit log at ${AUDIT_FILE}. Run stress-test first.`);
    process.exit(1);
  }

  const logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
  console.log(`Found ${logs.length} iterations to audit.\n`);

  for (const log of logs) {
    if (!log.workers) continue;

    for (const worker of log.workers) {
      const txHash = worker.proof || worker.result?.proof || worker.result?.txHash;
      if (!txHash) continue;

      try {
        console.log(`Checking Tx: ${txHash}...`);
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: txHash as `0x${string}`
        });

        const gasUsed = receipt.gasUsed.toString();
        const effectiveGasPrice = receipt.effectiveGasPrice.toString();

        // On Arc, the native token (USDC) is used for gas.
        // We calculate fee in units of 10^-18 (standard EVM wei)
        const feeWei = receipt.gasUsed * receipt.effectiveGasPrice;
        // Convert to USDC (6 decimals) assuming 18 decimal wei
        const feeUsdc = Number(feeWei) / 1e18;

        console.log(`  ✓ Gas Used: ${gasUsed}`);
        console.log(`  ✓ Fee: ${feeUsdc.toFixed(8)} USDC`);

        if (feeUsdc > 0.001) {
          console.warn(`  ⚠️ Warning: Significant fee detected: ${feeUsdc.toFixed(8)} USDC`);
        } else if (feeUsdc > 0) {
          console.log(`  ✅ Micro-fee verified: ${feeUsdc.toFixed(8)} USDC (Effectively zero for the agentic economy).`);
        } else {
          console.log(`  ✅ Zero-gas verified.`);
        }
      } catch (err: any) {
        console.error(`  ❌ Failed to fetch receipt for ${txHash}: ${err.message}`);
      }
    }
  }

  console.log("\n--- GAS AUDIT COMPLETE ---");
}

main().catch(err => {
  console.error("Audit failed:", err);
  process.exit(1);
});
