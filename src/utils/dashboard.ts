import blessed from 'blessed';
import chalk from 'chalk';

export class Dashboard {
  private screen: blessed.Widgets.Screen;
  private logBox: blessed.Widgets.Log;
  private statsBox: blessed.Widgets.Box;
  private arcBox: blessed.Widgets.Box;
  
  private totalUsdc: number = 0;
  private totalCost: number = 0;
  private txCount: number = 0;

  constructor() {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'AgentStack Arc Orchestrator',
      fullUnicode: true,
    });

    // 1. Header
    blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: `{center}${chalk.bold.cyan(' ⬡ AGENTSTACK ARC ORCHESTRATOR ⬡ ')}{/center}`,
      tags: true,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } }
    });

    // 2. Main Log Feed
    this.logBox = blessed.log({
      parent: this.screen,
      top: 3,
      left: 0,
      width: '70%',
      height: '80%',
      label: ' Live Handshake Feed ',
      border: { type: 'line' },
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { ch: ' ', track: { bg: 'cyan' }, style: { inverse: true } },
      style: { border: { fg: 'white' } },
      tags: true
    });

    // 3. Margin & Stats
    this.statsBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: '70%',
      width: '30%',
      height: '40%',
      label: ' Unit Economics ',
      border: { type: 'line' },
      style: { border: { fg: 'green' } },
      tags: true
    });

    // 4. Arc L1 Status
    this.arcBox = blessed.box({
      parent: this.screen,
      top: '40%+3',
      left: '70%',
      width: '30%',
      height: '40%-3',
      label: ' Arc L1 Pulse ',
      border: { type: 'line' },
      style: { border: { fg: 'yellow' } },
      tags: true
    });

    // 5. Build Footer
    blessed.box({
      parent: this.screen,
      top: '80%+3',
      left: 0,
      width: '100%',
      height: 3,
      content: ` {bold}Status:{/bold} ${chalk.green('LIVE TESTNET')} | {bold}Network:{/bold} Arc (5042002) | {bold}Press 'q' to exit{/bold}`,
      tags: true,
      border: { type: 'line' },
      style: { border: { fg: 'cyan' } }
    });

    this.screen.key(['q', 'C-c'], () => process.exit(0));
    this.updateStats();
    this.updateArc();
    this.screen.render();
  }

  public log(module: string, message: string, metadata?: any) {
    const time = new Date().toLocaleTimeString();
    const moduleStr = chalk.bold.magenta(`[${module}]`);
    let metaStr = '';
    
    if (metadata) {
      if (metadata.margin) {
        const revenue = parseFloat(metadata.revenue) || 0.01;
        const netProfit = parseFloat(metadata.netProfit) || 0.006;
        this.totalUsdc += revenue;
        this.totalCost += (revenue - netProfit);
        this.updateStats();
      }
      if (metadata.proof || metadata.txHash || (metadata.message && metadata.message.includes('Payment verified'))) {
        this.txCount++;
        this.updateArc();
      }
      metaStr = chalk.gray(` ${JSON.stringify(metadata)}`);
    }

    this.logBox.log(`${chalk.gray(time)} ${moduleStr} ${message}${metaStr}`);
    this.screen.render();
  }

  private updateStats() {
    const margin = this.totalUsdc > 0 ? ((this.totalUsdc - this.totalCost) / this.totalUsdc) * 100 : 0;
    this.statsBox.setContent(`
${chalk.bold('Revenue:')} ${chalk.green(`$${this.totalUsdc.toFixed(4)} USDC`)}
${chalk.bold('Expenses:')} ${chalk.red(`$${this.totalCost.toFixed(4)} USDC`)}

${chalk.bold('Gross Margin:')}
${chalk.bold.green(` ${margin.toFixed(1)}%`)}

${chalk.gray('Status: Optimized (2 Workers)')}
    `);
    this.screen.render();
  }

  private updateArc() {
    this.arcBox.setContent(`
${chalk.bold('Transactions:')} ${chalk.yellow(this.txCount)}
${chalk.bold('L1 Settlement:')} ${chalk.green('ACTIVE')}

${chalk.bold('Handshake Status:')}
${this.txCount > 0 ? chalk.cyan('Settling x402...') : chalk.gray('Awaiting Request')}

${chalk.gray('Chain ID: 5042002')}
    `);
    this.screen.render();
  }
}

export const dashboard = process.env.ENABLE_DASHBOARD === 'true' ? new Dashboard() : null;
