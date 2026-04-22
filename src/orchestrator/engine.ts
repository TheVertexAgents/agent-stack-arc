import express from 'express';
import type { Request, Response } from 'express';
import { Contractor } from './contractor.js';
import { logger } from '../utils/logger.js';
import type { TaskResult } from '../types/orchestrator.js';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Configured Worker URLs
const WORKER_CONFIG = {
  MARKET_DATA: 'http://localhost:3001/task',
  SENTIMENT: 'http://localhost:3002/task'
};

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
    // Phase 2 MVP: Hardcoded decomposition for Market Data + Sentiment
    // In later phases, this could be LLM-driven via Genkit.
    
    logger.info({ module: 'Orchestrator', message: 'Decomposing task into sub-jobs' });

    const [marketJob, sentimentJob] = await Promise.all([
      Contractor.hire(WORKER_CONFIG.MARKET_DATA, { pair: 'BTC/USDC' }),
      Contractor.hire(WORKER_CONFIG.SENTIMENT, { pair: 'BTC/USDC' })
    ]);

    const totalWorkerCost = marketJob.cost + sentimentJob.cost;
    // Strict sub-cent compliance: USER_PRICE ≤ $0.01 per hackathon rules
    const USER_PRICE = 0.01;
    const userPrice = USER_PRICE;
    const margin = userPrice - totalWorkerCost;

    const result: TaskResult = {
      paid: userPrice,
      workers: [
        { name: 'Market Data Specialist', cost: marketJob.cost, result: marketJob.result },
        { name: 'Social Sentiment Analyst', cost: sentimentJob.cost, result: sentimentJob.result }
      ],
      margin: parseFloat(margin.toFixed(4)),
      gas: 0,
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
