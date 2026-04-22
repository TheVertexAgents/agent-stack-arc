export interface TaskResult {
  taskId: string;
  revenue: string;
  expenses: {
    [key: string]: string;
    gas: string;
  };
  netProfit: string;
  margin: string;
  workers: {
    name: string;
    cost: number;
    result: any;
  }[];
  timestamp: string;
}

export interface OrchestrationRequest {
  prompt: string;
}
