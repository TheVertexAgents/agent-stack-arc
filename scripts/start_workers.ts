import { spawn } from 'child_process';
import { logger } from '../src/utils/logger.js';

const processes = [];

async function main() {
  logger.info({ module: 'StartWorkers', message: 'Starting all worker agents...' });

  const worker1 = spawn('npx', ['tsx', 'src/worker/specialist.ts'], { stdio: 'inherit' });
  const worker2 = spawn('npx', ['tsx', 'src/worker/sentiment.ts'], { stdio: 'inherit' });

  processes.push(worker1, worker2);

  process.on('SIGINT', () => {
    logger.info({ module: 'StartWorkers', message: 'Shutting down workers...' });
    processes.forEach(p => p.kill());
    process.exit(0);
  });

  logger.info({ module: 'StartWorkers', message: 'Workers are running. Press Ctrl+C to stop.' });
}

main();
