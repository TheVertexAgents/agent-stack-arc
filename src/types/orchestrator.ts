export interface TaskResult {
  paid: number; // Total paid by user
  workers: {
    name: string;
    cost: number;
    result: any;
  }[];
  margin: number; // Orchestrator profit
  gas: number; // Always 0 on Arc
  timestamp: string;
}

export interface OrchestrationRequest {
  prompt: string;
}
