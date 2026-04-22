import { spawn, ChildProcess } from 'child_process';
import { logger } from '../src/utils/logger.js';
import path from 'path';

const processes: ChildProcess[] = [];

/**
 * @title Integrated Demo Orchestrator
 * @dev Launches the full Agentic Economy stack: Workers -> Orchestrator -> Sentinel.
 */
async function main() {
  logger.info({ module: 'Demo', message: 'Starting Integrated Agentic Economy Demo...' });

  // 1. Start AgentStack Workers
  logger.info({ module: 'Demo', message: 'Launching AgentStack Workers (Ports 3001, 3002)...' });
  const workers = spawn('npm', ['run', 'start-workers'], { stdio: 'inherit' });
  processes.push(workers);

  // 2. Start AgentStack Orchestrator
  logger.info({ module: 'Demo', message: 'Launching AgentStack Orchestrator (Port 3003)...' });
  const orchestrator = spawn('npm', ['run', 'start-orchestrator'], {
    stdio: 'inherit',
    env: { ...process.env, ORCHESTRATOR_PORT: '3003' }
  });
  processes.push(orchestrator);

  // 3. Start Vertex Sentinel Dashboard
  logger.info({ module: 'Demo', message: 'Launching Vertex Sentinel Dashboard (Port 3000)...' });
  const dashboard = spawn('npm', ['run', 'dashboard'], {
    stdio: 'inherit',
    cwd: path.join(process.cwd(), 'vertex-sentinel')
  });
  processes.push(dashboard);

  // 4. Start Vertex Sentinel Trading Agent
  logger.info({ module: 'Demo', message: 'Launching Vertex Sentinel Trading Agent (The Client)...' });
  const sentinel = spawn('npm', ['start'], {
    stdio: 'inherit',
    cwd: path.join(process.cwd(), 'vertex-sentinel'),
    env: { ...process.env, ORCHESTRATOR_URL: 'http://localhost:3003/orchestrate' }
  });
  processes.push(sentinel);

  process.on('SIGINT', () => {
    logger.info({ module: 'Demo', message: 'Shutting down all integrated services...' });
    processes.forEach(p => p.kill());
    process.exit(0);
  });

  logger.info({ module: 'Demo', message: 'Full stack is initializing. Check logs for payment handshakes.' });
}

main().catch(err => {
  logger.error({ module: 'Demo', message: 'Demo launch failed', error: err.message });
  processes.forEach(p => p.kill());
  process.exit(1);
});
