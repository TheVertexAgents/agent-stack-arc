import { spawn, ChildProcess, execSync } from 'child_process';
import axios from 'axios';
import { logger } from '../src/utils/logger.js';

const processes: ChildProcess[] = [];
const PORTS = [3000, 3001, 3002];

function killPorts() {
  console.log('Cleaning up ports 3000, 3001, 3002...');
  try {
    execSync('fuser -k 3000/tcp 3001/tcp 3002/tcp || true', { stdio: 'ignore' });
  } catch (e) {
    // ignore errors
  }
}

async function waitForHealth(url: string, serviceName: string, maxRetries = 30): Promise<boolean> {
  console.log(`Waiting for ${serviceName} at ${url}...`);
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await axios.get(url, { timeout: 2000 });
      if (res.status === 200) {
        console.log(`✅ ${serviceName} is UP`);
        return true;
      }
    } catch (e) {
      // ignore
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.error(`❌ ${serviceName} failed to start`);
  return false;
}

async function main() {
  console.log('--- STARTING AGENTSTACK SMOKE TEST ---');

  killPorts();

  // 1. Start Workers
  const worker1 = spawn('npx', ['tsx', 'src/worker/specialist.ts'], { stdio: 'inherit' });
  const worker2 = spawn('npx', ['tsx', 'src/worker/sentiment.ts'], { stdio: 'inherit' });
  processes.push(worker1, worker2);

  // 2. Start Orchestrator
  const orchestrator = spawn('npx', ['tsx', 'src/orchestrator/engine.ts'], { stdio: 'inherit' });
  processes.push(orchestrator);

  // 3. Wait for services to be ready
  const healthChecks = [
    waitForHealth('http://localhost:3001/health', 'MarketDataWorker'),
    waitForHealth('http://localhost:3002/health', 'SentimentWorker'),
    waitForHealth('http://localhost:3000/health', 'Orchestrator')
  ];

  const results = await Promise.all(healthChecks);
  if (results.some(r => !r)) {
    console.error('One or more services failed to start correctly.');
    cleanup();
    process.exit(1);
  }

  try {
    // 4. Send Test Request
    console.log('Sending orchestration request...');
    const response = await axios.post('http://localhost:3000/orchestrate', {
      prompt: 'Give me BTC sentiment + OHLCV for today'
    }, { timeout: 60000 });
    
    const result = response.data;

    if (result) {
      console.log('--- SUCCESS ---');
      console.log('Response Detail:');
      console.log(JSON.stringify(result, null, 2));

      const marginValue = parseFloat(result.margin);
      if (marginValue > 0) {
        console.log(`✅ Margin Proof verified: ${result.margin} gross profit`);
      } else {
        console.warn('⚠️ Zero or negative margin detected - might be normal for mock data but check logic.');
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
    cleanup();
  }
}

function cleanup() {
  console.log('Shutting down services...');
  processes.forEach(p => {
    try {
      // Try to kill the process group or use fuser again to be sure
      p.kill('SIGINT');
    } catch (e) {}
  });
  
  // Final safeguard: kill ports again after a short delay
  setTimeout(() => {
    killPorts();
    process.exit(0);
  }, 1000);
}

main();
