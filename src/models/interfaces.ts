export interface AIModel {
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mistral' | 'local';
  capabilities: ModelCapability[];
  costPerToken: number;
  maxTokens: number;
  supports: {
    codeGeneration: boolean;
    analysis: boolean;
    reasoning: boolean;
    vision: boolean;
    functionCalling: boolean;
  };
}

export interface ModelCapability {
  type: 'analysis' | 'coding' | 'reasoning' | 'creative' | 'vision' | 'function_calling';
  strength: 'low' | 'medium' | 'high' | 'excellent';
}

export interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl?: string;
  models: AIModel[];
  makeRequest(prompt: string, model: string, options?: any): Promise<string>;
}

export interface ModelSelection {
  primary: string;
  fallback?: string;
  taskSpecific?: Record<string, string>;
}

export interface TaskContext {
  issueNumber?: number;
  repository: string;
  owner: string;
  githubToken: string;
  workingDirectory: string;
  modelSelection: ModelSelection;
  additionalParams?: Record<string, any>;
}

export interface TaskResult {
  success: boolean;
  message: string;
  data?: any;
  nextTasks?: string[];
  filesModified?: string[];
  modelUsed?: string;
  tokensUsed?: number;
  cost?: number;
}

export interface ClaudeCodeTask {
  name: string;
  description: string;
  category: 'analysis' | 'resolution' | 'maintenance' | 'reporting';
  priority: 'low' | 'medium' | 'high' | 'critical';
  trigger: string[];
  execute: (context: TaskContext) => Promise<TaskResult>;
  dependencies?: string[];
  requiredFiles?: string[];
}

export interface MultiModelConfig {
  providers: {
    openai?: { apiKey: string; models: string[] };
    anthropic?: { apiKey: string; models: string[] };
    local?: { baseUrl: string; models: string[] };
  };
  defaultModel: string;
  taskPreferences: Record<string, string>;
  costLimit?: number;
}