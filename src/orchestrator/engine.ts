import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { Contractor } from './contractor.js';
import { logger } from '../utils/logger.js';
import { TaskDecomposer } from './decomposer.js';
import type { TaskResult } from '../types/orchestrator.js';
import { v4 as uuidv4 } from 'uuid';

// Polyfill for Node.js 18 to support uuid v9+
if (typeof crypto === 'undefined') {
  const nodeCrypto = await import('node:crypto');
  // @ts-ignore
  globalThis.crypto = nodeCrypto.webcrypto;
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.ORCHESTRATOR_PORT || process.env.PORT || 3000;

/**
 * @title Orchestrator Engine
 * @dev Main gateway for decomposing and coordinating tasks.
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'Orchestrator' });
});

app.post('/orchestrate', async (req: Request, res: Response) => {
  const { prompt } = req.body;
  logger.info({ module: 'Orchestrator', message: 'New request received', prompt });

  try {
    const subTasks = TaskDecomposer.decompose(prompt);
    
    const jobs = await Promise.all(
      subTasks.map(task => Contractor.hire(task.workerUrl, task.data))
    );

    let totalWorkerCost = 0;
    const workerResults = jobs.map((job, i) => {
      totalWorkerCost += job.cost;
      return {
        name: subTasks[i].workerName,
        cost: job.cost,
        result: job.result,
        proof: job.proof || job.result?.proof || job.result?.txHash || null
      };
    });

    const USER_PRICE = 0.01;
    const netProfit = USER_PRICE - totalWorkerCost;
    const marginPercent = (netProfit / USER_PRICE) * 100;

    const expenses: any = { gas: "0.000 USDC" };
    workerResults.forEach(w => {
      const key = w.name.replace(/\s+/g, '').replace(/^\w/, c => c.toLowerCase());
      expenses[key] = `${w.cost.toFixed(3)} USDC`;
    });

    const result: TaskResult = {
      taskId: uuidv4(),
      revenue: `${USER_PRICE.toFixed(3)} USDC`,
      expenses,
      netProfit: `${netProfit.toFixed(3)} USDC`,
      margin: `${marginPercent.toFixed(0)}%`,
      workers: workerResults,
      timestamp: new Date().toISOString()
    };

    logger.info({ 
      module: 'Orchestrator', 
      message: 'Orchestration complete', 
      margin: result.margin 
    });

    return res.status(200).json(result);
  } catch (error: any) {
    logger.error({ module: 'Orchestrator', message: 'Orchestration failed', error: error.message });
    return res.status(500).json({ error: 'Internal orchestration error', details: error.message });
  }
});

app.listen(PORT, () => {
  logger.info({ module: 'Orchestrator', message: `Gateway live on port ${PORT}` });
});
