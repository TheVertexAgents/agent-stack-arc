import { logger } from '../utils/logger.js';

export interface SubTask {
  workerName: string;
  workerUrl: string;
  data: any;
}

/**
 * @title TaskDecomposer
 * @dev Decomposes a natural language prompt into specific sub-tasks for workers.
 */
export class TaskDecomposer {
  private static WORKER_CONFIG = {
    MARKET_DATA: process.env.WORKER_MARKET_URL || 'http://localhost:3001/task',
    SENTIMENT: process.env.WORKER_SENTIMENT_URL || 'http://localhost:3002/task'
  };

  /**
   * @dev Maps a prompt to parallel sub-tasks.
   * Currently uses a deterministic mapping for MVP.
   */
  static decompose(prompt: string): SubTask[] {
    logger.info({ module: 'TaskDecomposer', message: 'Decomposing prompt', prompt });

    const tasks: SubTask[] = [];

    // Simple keyword-based decomposition for MVP
    const normalizedPrompt = prompt.toLowerCase();

    if (normalizedPrompt.includes('price') || normalizedPrompt.includes('market') || normalizedPrompt.includes('btc')) {
      tasks.push({
        workerName: 'Market Data Specialist',
        workerUrl: this.WORKER_CONFIG.MARKET_DATA,
        data: { pair: 'BTC/USDC' }
      });
    }

    if (normalizedPrompt.includes('sentiment') || normalizedPrompt.includes('bullish') || normalizedPrompt.includes('btc')) {
      tasks.push({
        workerName: 'Social Sentiment Analyst',
        workerUrl: this.WORKER_CONFIG.SENTIMENT,
        data: { pair: 'BTC/USDC' }
      });
    }

    // Default: Return both if prompt is generic
    if (tasks.length === 0) {
      tasks.push(
        { workerName: 'Market Data Specialist', workerUrl: this.WORKER_CONFIG.MARKET_DATA, data: { pair: 'BTC/USDC' } },
        { workerName: 'Social Sentiment Analyst', workerUrl: this.WORKER_CONFIG.SENTIMENT, data: { pair: 'BTC/USDC' } }
      );
    }

    return tasks;
  }
}
