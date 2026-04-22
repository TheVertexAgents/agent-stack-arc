import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import { logger } from '../src/utils/logger.js';

const processes: ChildProcess[] = [];

async function main() {
  console.log('--- STARTING AGENTSTACK SMOKE TEST ---');

  // 0. Pre-flight Cleanup
  const ports = [3001, 3002, 3003];
  console.log(`Cleaning up ports: ${ports.join(', ')}`);
  try {
    spawn('sh', ['-c', `kill $(lsof -t -i :${ports.join(',')}) 2>/dev/null || true`]);
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {}

  // 1. Start Workers
  const worker1 = spawn('npx', ['tsx', 'src/worker/specialist.ts'], { stdio: 'inherit' });
  const worker2 = spawn('npx', ['tsx', 'src/worker/sentiment.ts'], { stdio: 'inherit' });
  processes.push(worker1, worker2);

  // 2. Start Orchestrator
  const orchestrator = spawn('npx', ['tsx', 'src/orchestrator/engine.ts'], { stdio: 'inherit' });
  processes.push(orchestrator);

  // Wait for services to warm up
  console.log('Waiting 25s for services to start and stabilize on Live Network...');
  await new Promise(r => setTimeout(r, 25000));

  try {
    // 3. Send Test Request with retries
    console.log('Sending orchestration request (with retries)...');
    let result;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        const orchestratorPort = process.env.ORCHESTRATOR_PORT || 3003;
        const response = await axios.post(`http://localhost:${orchestratorPort}/orchestrate`, {
          prompt: 'Give me BTC sentiment + OHLCV for today'
        });
        result = response.data;
        break;
      } catch (error: any) {
        if (attempts >= maxAttempts) throw error;
        console.log(`Attempt ${attempts} failed: ${error.message}, retrying in 3s...`);
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    if (result) {
      console.log('--- SUCCESS ---');
      console.log('Response Detail:');
      console.log(JSON.stringify(result, null, 2));

      if (result.margin > 0) {
        console.log(`✅ Margin Proof verified: $${result.margin} USDC earned`);
      } else {
        console.error('❌ Negative margin detected!');
      }
    }
  } catch (error: any) {
    console.error('--- FAILURE ---');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    // Kill processes
    processes.forEach(p => p.kill());
    process.exit(0);
  }
}

main();
