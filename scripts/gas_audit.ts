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

        // On Arc, the native token (USDC) is used for gas, and we expect 0 fee
        const fee = receipt.gasUsed * receipt.effectiveGasPrice;

        console.log(`  ✓ Gas Used: ${gasUsed}`);
        console.log(`  ✓ Fee: ${fee.toString()} USDC`);

        if (fee > 0n) {
          console.warn(`  ⚠️ Warning: Non-zero fee detected on Arc!`);
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
