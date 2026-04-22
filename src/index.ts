import { spawn, ChildProcess } from 'child_process';
import { logger } from './utils/logger.js';
import { dashboard } from './utils/dashboard.js';

const processes: ChildProcess[] = [];

/**
 * @title AgentStack Monolith Entry
 * @dev Launches the Orchestrator and all Worker Agents in one process for easy local dev.
 */
async function main() {
  if (process.env.ENABLE_DASHBOARD === 'true') {
    console.log('Booting with Dashboard...');
  } else {
    logger.info({ module: 'AgentStack', message: 'Booting the Agentic Economy on Arc...' });
  }

  // 1. Start Workers
  const worker1 = spawn('npx', ['tsx', 'src/worker/specialist.ts'], {
    stdio: process.env.ENABLE_DASHBOARD === 'true' ? 'pipe' : 'inherit',
    env: { ...process.env, LOG_LEVEL: 'info' }
  });

  const worker2 = spawn('npx', ['tsx', 'src/worker/sentiment.ts'], {
    stdio: process.env.ENABLE_DASHBOARD === 'true' ? 'pipe' : 'inherit',
    env: { ...process.env, LOG_LEVEL: 'info' }
  });

  // 2. Start Orchestrator
  const orchestrator = spawn('npx', ['tsx', 'src/orchestrator/engine.ts'], {
    stdio: process.env.ENABLE_DASHBOARD === 'true' ? 'pipe' : 'inherit',
    env: { ...process.env, LOG_LEVEL: 'info' }
  });

  processes.push(worker1, worker2, orchestrator);

  if (process.env.ENABLE_DASHBOARD === 'true' && dashboard) {
    const handleOutput = (module: string, data: any) => {
      const lines = data.toString().split('\n');
      lines.forEach((line: string) => {
        if (!line.trim()) return;
        try {
          const json = JSON.parse(line);
          dashboard.log(json.module || module, json.message, json);
        } catch {
          dashboard.log(module, line);
        }
      });
    };

    worker1.stdout?.on('data', (d) => handleOutput('MarketWorker', d));
    worker2.stdout?.on('data', (d) => handleOutput('SentimentWorker', d));
    orchestrator.stdout?.on('data', (d) => handleOutput('Orchestrator', d));
  }

  process.on('SIGINT', () => {
    logger.info({ module: 'AgentStack', message: 'Shutting down all services...' });
    processes.forEach(p => p.kill());
    process.exit(0);
  });

  if (process.env.ENABLE_DASHBOARD !== 'true') {
    logger.info({ module: 'AgentStack', message: 'All services are active. Gateway on :3000' });
  }
}

main().catch(err => {
  logger.error({ module: 'AgentStack', message: 'Bootstrapping failed', error: err.message });
  processes.forEach(p => p.kill());
  process.exit(1);
});
