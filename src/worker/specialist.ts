import { AbstractWorker } from './base.js';

/**
 * @title MarketDataWorker
 * @dev specialized worker for OHLCV data.
 */
export class MarketDataWorker extends AbstractWorker {
  protected handleTask(input: any) {
    const pair = input.pair || 'BTC/USDC';
    return {
      pair,
      ohlcv: [
        { t: Date.now(), o: 65000, h: 65500, l: 64800, c: 65200, v: 1.2 },
        { t: Date.now() - 3600000, o: 64800, h: 65100, l: 64500, c: 65000, v: 0.8 }
      ],
      source: 'MockKraken',
      verified: true
    };
  }
}

// Start standalone if script is run directly
if (process.argv[1]?.includes('specialist.ts')) {
  const worker = new MarketDataWorker(
    'MarketDataWorker', 
    3001, 
    process.env.WORKER_1_PRIVATE_KEY || '0x0000000000000000000000000000000000000001'
  );
  worker.start();
}
