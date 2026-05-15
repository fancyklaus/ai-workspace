// 模型类型
export type ModelProvider = 'ollama' | 'openai' | 'claude' | 'qwen' | 'ernie';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelParams {
  modelName: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: TokenUsage;
  finishReason: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelConfig {
  provider: ModelProvider;
  endpoint?: string;
  apiKey?: string;
  defaultModel: string;
}
