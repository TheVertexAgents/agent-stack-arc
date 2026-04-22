import axios from 'axios';
import { logger } from '../src/utils/logger.js';
import fs from 'fs';
import { spawn, ChildProcess } from 'child_process';

const processes: ChildProcess[] = [];
const ORCHESTRATOR_URL = 'http://localhost:3000/orchestrate';
const ITERATIONS = 20; // 20 loops * 3 txs (User->Orch, Orch->WorkerA, Orch->WorkerB) = 60 txs
const AUDIT_FILE = 'docs/STRESS_TEST_LOG.json';

/**
 * Polls an array of health-check URLs until all respond 2xx,
 * or throws if the deadline (ms) is exceeded.
 */
async function waitForServices(urls: string[], timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const ready = new Set<string>();

  while (ready.size < urls.length) {
    if (Date.now() > deadline) {
      throw new Error(
        `Services failed to start within ${timeoutMs / 1000}s. ` +
        `Still waiting on: ${urls.filter(u => !ready.has(u)).join(', ')}`
      );
    }
    for (const url of urls) {
      if (ready.has(url)) continue;
      try {
        await axios.get(url, { timeout: 1000 });
        ready.add(url);
        console.log(`  ✓ ${url} is up`);
      } catch {
        // Not ready yet — keep polling
      }
    }
    if (ready.size < urls.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

async function runStressTest() {
  console.log(`--- STARTING AGENTSTACK STRESS TEST (${ITERATIONS} iterations) ---`);

  // Cleanup any stray processes on our ports before starting
  const ports = [3000, 3001, 3002];
  for (const port of ports) {
    try {
      if (process.platform !== 'win32') {
        spawn('sh', ['-c', `lsof -t -i:${port} | xargs kill -9`], { stdio: 'ignore' });
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  const worker1 = spawn('npx', ['tsx', 'src/worker/specialist.ts'], { stdio: 'inherit' });
  const worker2 = spawn('npx', ['tsx', 'src/worker/sentiment.ts'], { stdio: 'inherit' });
  processes.push(worker1, worker2);
  const orchestrator = spawn('npx', ['tsx', 'src/orchestrator/engine.ts'], { stdio: 'inherit' });
  processes.push(orchestrator);

  console.log('Polling for service readiness (max 120s)...');
  await waitForServices([
    'http://localhost:3001/health',
    'http://localhost:3002/health',
    'http://localhost:3000/health',
  ], 120000);
  console.log('All services ready. Starting stress test...\n');

  const auditLogs: any[] = [];

  for (let i = 1; i <= ITERATIONS; i++) {
    try {
      console.log(`[Iteration ${i}/${ITERATIONS}] Orchestrating...`);
      const response = await axios.post(ORCHESTRATOR_URL, {
        prompt: `Stress test request #${i}: Market Data + Sentiment for BTC`
      });

      const { revenue, margin, timestamp, workers } = response.data;
      console.log(`   ✅ Success. Revenue: ${revenue} | Margin: ${margin}`);

      auditLogs.push({
        iteration: i,
        timestamp,
        revenue,
        margin,
        workers
      });

    } catch (error: any) {
      console.error(`   ❌ Iteration ${i} failed:`, error.message);
    }

    // Small delay between iterations
    await new Promise(r => setTimeout(r, 500));
  }

  // Save audit log
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(auditLogs, null, 2));
  console.log(`\n--- STRESS TEST COMPLETE ---`);
  console.log(`Audit log saved to ${AUDIT_FILE}`);

  const totalMargin = auditLogs.reduce((acc, log) => acc + parseFloat(log.margin), 0);
  const totalTxs = auditLogs.length * 3; // Approx 3 on-chain events per loop

  console.log(`\nSummary:`);
  console.log(`- Total Requests: ${auditLogs.length}`);
  console.log(`- Projected On-Chain Txs: ${totalTxs}`);
  console.log(`- Total Profit Earned: ${totalMargin.toFixed(1)}% (cumulative)`);

  processes.forEach(p => p.kill());
  process.exit(0);
}

runStressTest().catch((e) => {
  console.error(e);
  processes.forEach(p => p.kill());
  process.exit(1);
});
