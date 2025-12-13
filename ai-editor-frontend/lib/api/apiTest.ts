import apiClient from './client';

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

export interface SwaggerSpec {
  swaggerSpec: string;
  success: boolean;
}

export interface ApiTestResult {
  success: boolean;
  output: string;
  error: string;
  passed?: number;
  failed?: number;
  total?: number;
  exitCode?: number;
}

export interface ApiTestGeneration {
  testCode: string;
  swaggerSpec: string;
  success: boolean;
}

export const apiTestApi = {
  /**
   * Generate Swagger/OpenAPI specification
   */
  async generateSwagger(fileId?: string, code?: string, language?: string, framework?: string): Promise<SwaggerSpec> {
    const response = await apiClient.post('/api-test/generate-swagger', {
      fileId,
      code,
      language,
      framework,
    });
    return response.data;
  },

  /**
   * Generate API tests
   */
  async generateApiTests(
    fileId?: string,
    code?: string,
    language?: string,
    swaggerSpec?: string,
    testFramework: 'jest' | 'swagger' = 'jest'
  ): Promise<ApiTestGeneration> {
    const response = await apiClient.post('/api-test/generate-tests', {
      fileId,
      code,
      language,
      swaggerSpec,
      testFramework,
    });
    return response.data;
  },

  /**
   * Run API tests
   */
  async runApiTests(
    fileId: string,
    testCode: string,
    language?: string,
    apiCode?: string,
    testFramework: 'jest' | 'swagger' = 'jest'
  ): Promise<ApiTestResult> {
    const response = await apiClient.post('/api-test/run-tests', {
      fileId,
      testCode,
      language,
      apiCode,
      testFramework,
    });
    return response.data;
  },

  /**
   * Start API improvement loop
   */
  async startApiImprovementLoop(
    fileId: string,
    mode: 'manual' | 'auto' = 'auto',
    maxIterations: number = 10,
    testFramework: 'jest' | 'swagger' = 'jest'
  ): Promise<{ loopId: string; status: string }> {
    const response = await apiClient.post('/api-test/improve-loop', {
      fileId,
      mode,
      maxIterations,
      testFramework,
    });
    return response.data;
  },

  /**
   * Get API loop status
   */
  async getApiLoopStatus(loopId: string): Promise<ImprovementLoopState> {
    const response = await apiClient.get(`/api-test/loop-status/${loopId}`);
    return response.data;
  },

  /**
   * Stop API improvement loop
   */
  async stopApiLoop(loopId: string): Promise<{ success: boolean; status: string }> {
    const response = await apiClient.post(`/api-test/loop-stop/${loopId}`);
    return response.data;
  },

  /**
   * Execute single step (for manual mode)
   */
  async executeApiStep(
    fileId: string,
    action: 'generate-swagger' | 'generate-tests' | 'run-tests' | 'improve' | 'apply',
    loopId?: string,
    testFramework?: 'jest' | 'swagger',
    swaggerSpec?: string,
    testCode?: string,
    apiCode?: string,
    error?: string
  ): Promise<{
    result: any;
    nextAction: string;
  }> {
    const response = await apiClient.post('/api-test/step', {
      fileId,
      action,
      loopId,
      testFramework,
      swaggerSpec,
      testCode,
      apiCode,
      error,
    });
    return response.data;
  },
};

