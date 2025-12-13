import apiClient from './client';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error: string;
  exitCode: number;
  executionTime?: number;
}

export interface TestResult {
  success: boolean;
  testCode?: string;
  output: string;
  error: string;
  passed?: number;
  failed?: number;
  total?: number;
}

export interface ImprovementLoopState {
  loopId: string;
  fileId: string;
  mode: 'manual' | 'auto';
  status: 'running' | 'stopped' | 'completed' | 'failed';
  iteration: number;
  maxIterations: number;
  currentCode: string;
  lastError?: string;
  history: Array<{
    iteration: number;
    code: string;
    error?: string;
    output?: string;
    success: boolean;
  }>;
}

export const testApi = {
  /**
   * Run code execution
   */
  async runCode(fileId?: string, code?: string, language?: string): Promise<ExecutionResult> {
    const response = await apiClient.post('/test/run-code', {
      fileId,
      code,
      language,
    });
    return response.data;
  },

  /**
   * Generate test suite and run it
   */
  async generateAndRunTests(fileId?: string, code?: string, language?: string): Promise<{
    testCode: string;
    testResult: TestResult;
    success: boolean;
  }> {
    const response = await apiClient.post('/test/generate-and-run', {
      fileId,
      code,
      language,
    });
    return response.data;
  },

  /**
   * Start improvement loop
   */
  async startImprovementLoop(
    fileId: string,
    mode: 'manual' | 'auto' = 'auto',
    maxIterations: number = 10
  ): Promise<{ loopId: string; status: string }> {
    const response = await apiClient.post('/test/improve-loop', {
      fileId,
      mode,
      maxIterations,
    });
    return response.data;
  },

  /**
   * Get loop status
   */
  async getLoopStatus(loopId: string): Promise<ImprovementLoopState> {
    const response = await apiClient.get(`/test/loop-status/${loopId}`);
    return response.data;
  },

  /**
   * Stop improvement loop
   */
  async stopLoop(loopId: string): Promise<{ success: boolean; status: string }> {
    const response = await apiClient.post(`/test/loop-stop/${loopId}`);
    return response.data;
  },

  /**
   * Execute single step (for manual mode)
   */
  async executeStep(
    fileId: string,
    action: 'run' | 'improve' | 'apply',
    loopId?: string,
    error?: string
  ): Promise<{
    result: any;
    nextAction: string;
  }> {
    const response = await apiClient.post('/test/step', {
      fileId,
      action,
      loopId,
      error, // Pass error for manual mode when improving
    });
    return response.data;
  },
};

