import axios from 'axios';
import { logger } from '../src/utils/logger.js';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

const processes: ChildProcess[] = [];
const ORCHESTRATOR_URL = 'http://localhost:3000/orchestrate';
const ITERATIONS = 20; // 20 loops * 3 txs (User->Orch, Orch->WorkerA, Orch->WorkerB) = 60 txs
const AUDIT_FILE = 'docs/STRESS_TEST_LOG.json';

async function runStressTest() {
  console.log(`--- STARTING AGENTSTACK STRESS TEST (${ITERATIONS} iterations) ---`);
  
  const worker1 = spawn('npx', ['tsx', 'src/worker/specialist.ts'], { stdio: 'inherit' });
  const worker2 = spawn('npx', ['tsx', 'src/worker/sentiment.ts'], { stdio: 'inherit' });
  processes.push(worker1, worker2);
  const orchestrator = spawn('npx', ['tsx', 'src/orchestrator/engine.ts'], { stdio: 'inherit' });
  processes.push(orchestrator);

  console.log('Waiting 25s for services to start and stabilize on Live Network...');
  await new Promise(r => setTimeout(r, 25000));

  const auditLogs = [];

  for (let i = 1; i <= ITERATIONS; i++) {
    try {
      console.log(`[Iteration ${i}/${ITERATIONS}] Orchestrating...`);
      const response = await axios.post(ORCHESTRATOR_URL, {
        prompt: `Stress test request #${i}: Market Data + Sentiment for BTC`
      });

      const { paid, margin, timestamp, workers } = response.data;
      console.log(`   ✅ Success. Margin: $${margin} USDC`);

      auditLogs.push({
        iteration: i,
        timestamp,
        paid,
        margin,
        worker_txs: workers.length
      });

    } catch (error: any) {
      console.error(`   ❌ Iteration ${i} failed:`, error.message);
    }

    // Small delay between iterations
    await new Promise(r => setTimeout(r, 500));
  }

  // Save audit log
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditLogs, null, 2));
  console.log(`--- STRESS TEST COMPLETE ---`);
  console.log(`Audit log saved to ${AUDIT_FILE}`);
  
  const totalMargin = auditLogs.reduce((acc, log) => acc + log.margin, 0);
  const totalTxs = auditLogs.length * 3; // Approx 3 on-chain events per loop
  
  console.log(`Summary:`);
  console.log(`- Total Requests: ${auditLogs.length}`);
  console.log(`- Projected On-Chain Txs: ${totalTxs}`);
  console.log(`- Total Margin Earned: $${totalMargin.toFixed(4)} USDC`);

  processes.forEach(p => p.kill());
  process.exit(0);
}

runStressTest().catch((e) => {
  console.error(e);
  processes.forEach(p => p.kill());
  process.exit(1);
});
