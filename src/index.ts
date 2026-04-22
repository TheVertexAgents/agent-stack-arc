import { spawn, ChildProcess } from 'child_process';
import { logger } from './utils/logger.js';

const processes: ChildProcess[] = [];

/**
 * @title AgentStack Monolith Entry
 * @dev Launches the Orchestrator and all Worker Agents in one process for easy local dev.
 */
async function main() {
  logger.info({ module: 'AgentStack', message: 'Booting the Agentic Economy on Arc...' });

  // 1. Start Workers
  logger.info({ module: 'AgentStack', message: 'Starting Worker A (Market Data)...' });
  const worker1 = spawn('npx', ['tsx', 'src/worker/specialist.ts'], { stdio: 'inherit' });

  logger.info({ module: 'AgentStack', message: 'Starting Worker B (Sentiment)...' });
  const worker2 = spawn('npx', ['tsx', 'src/worker/sentiment.ts'], { stdio: 'inherit' });

  // 2. Start Orchestrator
  logger.info({ module: 'AgentStack', message: 'Starting Orchestrator Gateway...' });
  const orchestrator = spawn('npx', ['tsx', 'src/orchestrator/engine.ts'], { stdio: 'inherit' });

  processes.push(worker1, worker2, orchestrator);

  process.on('SIGINT', () => {
    logger.info({ module: 'AgentStack', message: 'Shutting down all services...' });
    processes.forEach(p => p.kill());
    process.exit(0);
  });

  logger.info({ module: 'AgentStack', message: 'All services are active. Gateway on :3000' });
}

main().catch(err => {
  logger.error({ module: 'AgentStack', message: 'Bootstrapping failed', error: err.message });
  processes.forEach(p => p.kill());
  process.exit(1);
});
