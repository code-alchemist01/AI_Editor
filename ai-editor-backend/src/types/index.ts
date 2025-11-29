export enum CreatorMode {
  CHAT = 'CHAT',
  CODE_GENERATION = 'CODE_GENERATION',
  CODE_EXPLANATION = 'CODE_EXPLANATION',
  ERROR_FIXING = 'ERROR_FIXING',
  REFACTORING = 'REFACTORING',
  TEST_GENERATION = 'TEST_GENERATION',
  DOCUMENTATION = 'DOCUMENTATION',
  CODE_REVIEW = 'CODE_REVIEW',
  PERFORMANCE_ANALYSIS = 'PERFORMANCE_ANALYSIS',
  SECURITY_SCAN = 'SECURITY_SCAN',
  ARCHITECTURE = 'ARCHITECTURE',
  MULTI_FILE = 'MULTI_FILE',
  PROJECT_GEN = 'PROJECT_GEN'
}

export interface ModelConfig {
  thinkingBudget?: number;
  useSearch?: boolean;
}

export interface AttachedFile {
  name: string;
  content: string;
  type?: string;
  size?: number;
}

export interface Message {
  id?: string;
  conversationId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  mode?: CreatorMode;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

export interface Conversation {
  id?: string;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FileRecord {
  id?: string;
  conversationId?: string;
  name: string;
  path?: string;
  content?: string;
  language?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Project {
  id?: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
